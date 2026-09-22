"""Owned Arcade models. Run: blender --background --python tools/blender/build_arcade_assets.py
Coordinates in helpers follow the game: Y up, -Z forward. Exports are texture-free GLB.
"""
import bpy, bmesh, json, hashlib
import math
from pathlib import Path
from mathutils import Vector
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public/game-assets/arcade-blender'
SOURCE = ROOT / 'source-art/arcade'
REVIEW = ROOT / '.artifacts/blender-arcade'
for p in (OUT, SOURCE, REVIEW): p.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.preferences.filepaths.save_version = 0

def v(p): return (p[0], -p[2], p[1])
def material(name, hexcolor, metal=0, rough=.55, glow=0):
    rgb = tuple(int(hexcolor[i:i+2],16)/255 for i in (0,2,4))
    # Hex palettes are sRGB; Blender/PBR inputs are linear.
    rgb = tuple(c/12.92 if c < .04045 else ((c+.055)/1.055)**2.4 for c in rgb)
    m=bpy.data.materials.new(name); m.diffuse_color=(*rgb,1); m.use_nodes=True
    b=m.node_tree.nodes.get('Principled BSDF'); b.inputs['Base Color'].default_value=(*rgb,1)
    b.inputs['Metallic'].default_value=metal; b.inputs['Roughness'].default_value=rough
    b.inputs['Emission Color'].default_value=(*rgb,1); b.inputs['Emission Strength'].default_value=glow
    return m
M={k:material(k,*args) for k,args in {
 'Ivory':('F5E4BC',.08,.55), 'Teal':('2C858A',.25,.34), 'Coral':('E76543',.15,.42),
 'Gold':('E9B64A',.38,.36), 'Navy':('20394D',.25,.46), 'Window':('93E9F1',.15,.22,.65),
 'Wood':('784928',0,.8), 'WoodLight':('C89459',0,.72), 'Sail':('FBDE9B',0,.8),
 'Stone':('846D58',0,.88), 'StoneLight':('BC9B75',0,.86), 'Bone':('EADBAB',0,.7),
 'Leaf':('508753',0,.82), 'Moss':('8AA15B',0,.88), 'Violet':('69508D',.1,.6),
 'Night':('363958',.15,.68), 'Moon':('D3C3E8',.05,.48), 'Amber':('FFCC65',.08,.32,.55),
 'LeafLight':('79AC63',0,.85), 'LeafDark':('2F6955',0,.85), 'Petal':('F3C756',0,.7),
 'Crystal':('64CFD9',.2,.25,.15), 'Blue':('315BA1',.3,.4),
}.items()}

def mesh(name, pts, faces, mat, bevel=0, smooth=False):
    data=bpy.data.meshes.new(name); data.from_pydata([v(p) for p in pts],[],faces); data.update()
    bm=bmesh.new(); bm.from_mesh(data); bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces)); bm.to_mesh(data); bm.free()
    o=bpy.data.objects.new(name,data); bpy.context.collection.objects.link(o); o.data.materials.append(M[mat])
    if bevel:
        mod=o.modifiers.new('Soft manufactured edges','BEVEL'); mod.width=bevel; mod.segments=2
        mod=o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
    if smooth:
        for f in data.polygons:f.use_smooth=True
    return o

def box(name, center, size, mat, bevel=.04):
    x,y,z=center; a,b,c=[s/2 for s in size]
    o = mesh(name,[(u*a,w*b,t*c) for u,w,t in [(-1,-1,-1),(-1,-1,1),(-1,1,-1),(-1,1,1),(1,-1,-1),(1,-1,1),(1,1,-1),(1,1,1)]],[(0,4,6,2),(1,3,7,5),(0,1,5,4),(2,6,7,3),(0,2,3,1),(4,5,7,6)],mat,bevel)
    o.location=v(center)
    return o

def rings(name, rows, mat, axis='y', n=20, smooth=False):
    # Each row: axis coordinate, radius X, radius of second radial axis, centre X, centre second axis.
    pts=[]
    for a,rx,rz,cx,cz in rows:
        for j in range(n):
            q=2*math.pi*j/n
            pts.append((cx+rx*math.cos(q),a,cz+rz*math.sin(q)) if axis=='y' else (cx+rx*math.cos(q),cz+rz*math.sin(q),a))
    faces=[tuple(reversed(range(n))),tuple(range((len(rows)-1)*n,len(rows)*n))]
    for i in range(len(rows)-1):
        for j in range(n): faces.append((i*n+j,i*n+(j+1)%n,(i+1)*n+(j+1)%n,(i+1)*n+j))
    return mesh(name,pts,faces,mat,smooth=smooth)

def cylinder(name, center, r, h, mat, top=None, n=16):
    x,y,z=center
    return rings(name,[(y-h/2,r,r,x,z),(y+h/2,r if top is None else top,r if top is None else top,x,z)],mat,n=n)

def beam(name, start, end, radius, mat, r2=None, n=10):
    a=Vector(start); b=Vector(end); d=(b-a).normalized(); t=d.cross(Vector((0,1,0)))
    if t.length<.01:t=d.cross(Vector((1,0,0)))
    t.normalize(); u=d.cross(t); pts=[]
    for p,r in ((a,radius),(b,r2 if r2 is not None else radius)):
        for j in range(n): pts.append(tuple(p+r*(t*math.cos(j*2*math.pi/n)+u*math.sin(j*2*math.pi/n))))
    faces=[tuple(reversed(range(n))),tuple(range(n,n*2))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    return mesh(name,pts,faces,mat,smooth=True)

def slab(name, outline, y, thick, mat, bevel=.035):
    pts=[(x,y+t,z) for t in (-thick/2,thick/2) for x,z in outline]; n=len(outline)
    return mesh(name,pts,[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)],mat,bevel)

def arch(name, center, r, width, depth, mat, start=0, end=math.pi, steps=16):
    x,y,z=center; pts=[]
    for i in range(steps+1):
        a=start+(end-start)*i/steps
        for rr,zz in ((r-width/2,-depth/2),(r+width/2,-depth/2),(r+width/2,depth/2),(r-width/2,depth/2)):
            pts.append((x+math.cos(a)*rr,y+math.sin(a)*rr,z+zz))
    faces=[(3,2,1,0),tuple(range(steps*4,steps*4+4))]
    for i in range(steps):
        for j in range(4):faces.append((i*4+j,i*4+(j+1)%4,(i+1)*4+(j+1)%4,(i+1)*4+j))
    return mesh(name,pts,faces,mat,.025)

def windmill():
    cylinder('Terraced stone footing',(0,.15,0),1.45,.3,'StoneLight',n=12)
    rings('Tapered plaster tower',[(.3,1.1,1.1,0,0),(1.0,1.06,1.06,0,0),(2.6,.8,.8,0,0),(3.5,.7,.7,0,0)],'Ivory',n=16)
    for h in [.65,2.65,3.35]:cylinder('Timber belt',(0,h,0),1.1 if h<1 else .83,.13,'Wood',n=16)
    rings('Copper tiled roof',[(3.45,1.12,1.12,0,0),(3.58,1.15,1.15,0,0),(4.28,.08,.08,0,0)],'Teal',n=16)
    for x in [-.48,.48]:box('Window shutter',(x,2.22,-.81),(.2,.6,.12),'Teal')
    box('Upper window',(0,2.25,-.88),(.55,.57,.12),'Window')
    box('Arched door',(0,.85,-1.04),(.55,1.05,.12),'Wood',.12)
    for i in range(4):
        a=math.pi/6+i*math.pi/2; c=Vector((0,3.2,-1.15));d=Vector((math.cos(a),math.sin(a),0));t=Vector((-math.sin(a),math.cos(a),0))
        beam('Rotor spar',c,c+d*2.15,.045,'Wood')
        pts=[tuple(c+d*r+t*w+Vector((0,0,z))) for z in [-.025,.025] for r,w in [(.5,0),(.62,.4),(2.08,.4),(2.08,0)]]
        mesh('Woven sail',pts,[(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)],'Sail')
        for k in range(5):beam('Sail batten',c+d*(.68+k*.3),c+d*(.68+k*.3)+t*.4,.02,'WoodLight',n=6)
    beam('Axle',(0,3.2,-.82),(0,3.2,-1.36),.15,'Gold',n=16)
    for side in [-1,1]:
        box('Planter',(side*1.05,.4,-.9),(.55,.45,.5),'WoodLight')
        for j in range(3):cylinder('Garden shrub',(side*1.05+(j-1)*.14,.72,-.9),.22,.45,'Leaf',top=.12,n=7)

def fossil():
    slab('Layered sandstone base',[(-2,-1.1),(-1.2,-1.5),(1.8,-1.15),(2.05,.8),(.8,1.3),(-1.8,1)],.14,.28,'Stone')
    for side in [-1,1]:
        rings('Eroded sandstone column',[(.28,.8,.72,side*1.3,0),(1.3,.68,.63,side*1.42,0),(2.6,.5,.55,side*1.2,0),(3.1,.38,.45,side*1.13,0)],'StoneLight',n=9)
    arch('Natural stone bridge',(0,2.15,0),1.3,.72,1.2,'StoneLight')
    for z in [-.5,.1,.7]:arch('Exposed fossil rib',(0,1.7,z),1.2,.14,.13,'Bone',steps=14)
    beam('Fossil spine',(-1.6,.45,-.82),(1.6,.5,-.82),.13,'Bone',n=8)
    for i in range(8):cylinder('Vertebra',(i*.37-1.3,.56,-.82),.16,.15,'Bone',n=8)
    for side in [-1,1]:
        beam('Fern stem',(side*1.85,.25,.5),(side*1.8,1.3,.4),.035,'Wood')
        for j in range(4):
            h=.5+j*.18
            for flip in [-1,1]:slab('Fern leaflet',[(side*1.8,.4),(side*1.8+flip*(.58-j*.08),.45+j*.12),(side*1.8+flip*.18,.58)],h,.035,'Leaf')

def moon():
    cylinder('Moonstone footing',(0,.18,0),1.45,.36,'Night',n=12)
    rings('Curved observatory stem',[(.36,.72,.72,0,0),(1.2,.55,.62,.08,0),(2.6,.67,.7,-.12,0),(3.0,1.1,1.1,0,0)],'Violet',n=16)
    cylinder('Lantern balcony',(0,3.04,0),1.25,.18,'Gold',n=20)
    for i in range(8):
        a=i*math.tau/8
        beam('Lantern frame',(math.cos(a)*.88,3.1,math.sin(a)*.88),(math.cos(a)*.88,3.85,math.sin(a)*.88),.055,'Gold')
    cylinder('Warm lantern glass',(0,3.5,0),.81,.74,'Amber',n=16)
    rings('Moonwood cap',[(3.88,1.46,1.46,0,0),(4.04,1.48,1.48,0,0),(4.4,.9,.9,-.12,0),(4.75,.43,.43,-.3,0),(4.92,.08,.08,-.48,0)],'Teal',n=24)
    arch('Crescent finial',(-.48,5.23,0),.39,.14,.12,'Moon',start=.5,end=5.75,steps=22)
    box('Door',(0,1.02,-.71),(.46,1.05,.12),'Night',.16)
    for y in [1.9,2.42]:box('Glowing window',(.0,y,-.67),(.28,.3,.08),'Amber',.11)
    for x,z in [(-1.1,.4),(.95,.65),(.9,-.9)]:
        beam('Small mushroom stem',(x,.24,z),(x,.68,z),.09,'Moon')
        rings('Small mushroom cap',[(.65,.4,.4,x,z),(.77,.38,.38,x,z),(.94,.08,.08,x,z)],'Violet',n=12)

def rocket():
    rings('Sculpted main fuselage',[(-1.7,.025,.025,0,.02),(-1.42,.21,.15,0,.05),(-.8,.38,.26,0,.02),(.1,.47,.34,0,0),(.76,.39,.29,0,-.04),(1.13,.24,.22,0,-.03)],'Ivory',axis='z',n=24,smooth=True)
    rings('Cockpit surround',[(-1.0,.05,.025,0,.22),(-.75,.25,.06,0,.29),(-.05,.3,.07,0,.36),(.34,.2,.035,0,.3)],'Navy',axis='z',n=20,smooth=True)
    rings('Blue glass canopy',[(-.95,.02,.015,0,.27),(-.65,.21,.16,0,.36),(-.08,.25,.22,0,.41),(.28,.14,.12,0,.37),(.34,.015,.015,0,.33)],'Window',axis='z',n=20,smooth=True)
    for side in [-1,1]:
        slab('Swept wing',[(side*.3,-.32),(side*.57,-.12),(side*1.22,.86),(side*1.08,1.05),(side*.36,.61)],-.09,.11,'Teal')
        slab('Wingtip coral inlay',[(side*.85,.46),(side*1.2,.86),(side*1.07,.99),(side*.91,.8)],-.015,.045,'Coral')
        rings('Engine nacelle',[(-.15,.08,.08,side*.7,-.15),(.05,.16,.16,side*.7,-.15),(.95,.16,.16,side*.7,-.15),(1.12,.13,.13,side*.7,-.15)],'Navy',axis='z',n=16,smooth=True)
        rings('Thruster collar',[(.96,.17,.17,side*.7,-.15),(1.13,.17,.17,side*.7,-.15)],'Gold',axis='z',n=16)
        rings('Thruster aperture',[(1.14,.11,.11,side*.7,-.15),(1.16,.11,.11,side*.7,-.15)],'Window',axis='z',n=16)
        for z in [.25,.42,.59]:box('Nacelle cooling louvre',(side*.71,.018,z),(.17,.04,.06),'Ivory',.01)
    # Vertical stabiliser, shaped explicitly instead of a debug cone.
    mesh('Dorsal tail',[(-.05,.15,.5),(.05,.15,.5),(-.04,.86,.85),(.04,.86,.85),(-.05,.65,1.12),(.05,.65,1.12),(-.05,.1,1.05),(.05,.1,1.05)],[(0,2,4,6),(1,7,5,3),(0,1,3,2),(2,3,5,4),(4,5,7,6),(6,7,1,0)],'Coral',.035)
    rings('Main engine nozzle',[(.94,.24,.24,0,-.03),(1.22,.24,.24,0,-.03)],'Navy',axis='z',n=20)
    rings('Main engine glow',[(1.23,.18,.18,0,-.03),(1.25,.18,.18,0,-.03)],'Window',axis='z',n=20)
    box('Nose racing stripe',(0,.235,-.92),(.11,.025,.42),'Gold',.01)

def observatory():
    cylinder('Station footing',(0,.18,0),1.55,.36,'Navy',n=12)
    rings('Habitat wall',[(.36,1.35,1.35,0,0),(1.25,1.35,1.35,0,0),(1.43,1.2,1.2,0,0)],'Ivory',n=16)
    cylinder('Pressure seal',(0,1.34,0),1.39,.16,'Teal',n=20)
    rings('Faceted telescope dome',[(1.46,1.25,1.25,0,0),(1.85,1.12,1.12,0,0),(2.25,.73,.73,0,0),(2.43,.12,.12,0,0)],'Teal',n=20,smooth=True)
    beam('Telescope barrel',(0,2.08,-.6),(0,2.52,-1.56),.22,'Navy',n=16)
    beam('Optic rim',(0,2.49,-1.5),(0,2.58,-1.66),.25,'Gold',n=16)
    beam('Telescope optic',(0,2.58,-1.67),(0,2.60,-1.71),.18,'Window',n=16)
    for i in range(8):
        a=math.tau*i/8;x=math.cos(a)*1.32;z=math.sin(a)*1.32
        o=box('Observation window',(x,.96,z),(.45,.3,.12),'Window');o.rotation_euler[2]=-a-math.pi/2
    box('Airlock frame',(0,.68,-1.37),(.64,.93,.2),'Gold',.1)
    box('Airlock door',(0,.65,-1.5),(.43,.72,.08),'Navy',.08)
    beam('Antenna',(.72,2.03,.3),(.72,3.2,.3),.045,'Gold')
    cylinder('Antenna beacon',(.72,3.23,.3),.13,.22,'Amber')

def solar():
    box('Generator foot',(0,.2,0),(1.55,.4,1.5),'Navy',.15)
    box('Generator cabinet',(0,.9,0),(1.05,1.15,.96),'Ivory',.12)
    for side in [-1,1]:
        beam('Solar support',(0,1.1,0),(side*1.05,2.1,0),.09,'Gold')
        panel=box('Solar panel frame',(side*1.05,2.12,0),(1.6,.11,2),'Navy',.05)
        panel.rotation_euler[1]=-side*.22
        for row in range(4):
            for col in range(3):
                cell=box('Photovoltaic cell',(side*1.05+(col-1)*.44,2.21+side*(col-1)*.097,(row-1.5)*.43),(.4,.04,.38),'Blue',.015)
                cell.rotation_euler[1]=-side*.22
    for j in range(3):box('Generator vent',(0,.64+j*.21,-.5),(.62,.06,.045),'Teal',.01)
    beam('Signal mast',(0,1.3,.38),(0,3.15,.38),.05,'Ivory')
    cylinder('Signal cap',(0,3.2,.38),.14,.17,'Window')

def crystal():
    rings('Asteroid shelf',[(0,1.3,.95,0,0),(.25,1.4,1.08,.08,0),(.65,1.13,.8,0,0),(.82,.7,.56,-.14,0)],'Stone',n=9)
    for x,z,h,r in [(-.5,.05,2.8,.36),(.15,.25,2,.4),(.65,-.15,1.4,.26),(-.55,-.5,1.2,.22)]:
        rings('Hexagonal ice crystal',[(.52,r,r,x,z),(.52+h*.8,r*.82,r*.82,x+h*.06,z),(.52+h,.02,.02,x+h*.09,z)],'Crystal',n=6)
    for x,z in [(-.9,.3),(.8,.45),(.15,-.75)]:cylinder('Copper mineral',(x,.5,z),.23,.6,'Gold',top=.06,n=5)

def meadow_tree():
    rings('Rooted curved trunk',[(0,.43,.42,0,0),(.25,.3,.29,0,0),(1.2,.2,.18,.08,0),(2.4,.11,.11,-.08,0),(3,.07,.07,.1,0)],'Wood',n=10)
    for i,(x,z,h,r) in enumerate([(-.85,.05,2.5,.88),(.72,.2,2.85,1.05),(.03,-.2,3.65,.96),(.05,.7,3.1,.8)]):
        beam('Reaching branch',(0,1.65,0),(x,h,z),.13,'WoodLight',r2=.055)
        rings('Layered rounded crown',[(h-.65,r*.45,r*.42,x,z),(h-.35,r*.89,r*.82,x,z),(h+.1,r,r*.9,x+.12,z),(h+.55,r*.7,r*.7,x+.08,z),(h+.8,r*.12,r*.12,x,z)],['Leaf','LeafLight','LeafDark','Leaf'][i],n=10)
    for a in range(7):
        x=math.cos(a*2.4)*(.5+a*.12);z=math.sin(a*2.4)*(.5+a*.12)
        beam('Wildflower stem',(x,0,z),(x,.4,z),.022,'LeafDark',n=6)
        for j in range(5):cylinder('Golden wildflower',(x+math.cos(j*math.tau/5)*.09,.41,z+math.sin(j*math.tau/5)*.09),.085,.04,'Petal',n=6)

def cycad():
    for index,(cx,cz,h) in enumerate([(0,0,2.9),(-1.25,.45,1.5),(.8,.7,1.8)]):
        rings('Ancient ringed trunk',[(0,.34,.34,cx,cz),(h*.5,.25,.25,cx,cz),(h,.15,.15,cx+.15,cz)],'Wood',n=10)
        for y in range(5):cylinder('Trunk leaf scar',(cx+.05,y*h/5+.2,cz),.3-y*.027,.09,'StoneLight',n=10)
        for i in range(9):
            a=i*math.tau/9+index*.7;dx,dz=math.cos(a),math.sin(a);reach=h*.62
            start=(cx+.15,h,cz);end=(cx+dx*reach,h-.45,cz+dz*reach)
            beam('Arching frond midrib',start,end,.032,'LeafLight',n=6)
            for j in range(5):
                t=.16+j*.16;x=cx+.15+dx*reach*t;z=cz+dz*reach*t;y=h-.45*t
                for side in [-1,1]:
                    spread=(1-t)*.44
                    slab('Fern pinna',[(x,z),(x-dz*side*spread-dx*.18,z+dx*side*spread-dz*.18),(x+dx*.18,z+dz*.18)],y,.025,'Leaf' if index%2 else 'LeafLight',bevel=0)
    rings('Basalt companion rock',[(0,.9,.65,-.7,-.9),(.45,.75,.55,-.7,-.9),(.75,.22,.23,-.8,-.9)],'Stone',n=7)

def mushrooms():
    for i,(x,z,h,r) in enumerate([(-.65,.15,3.4,1.05),(.85,.2,2.3,.85),(-.2,-.95,1.25,.55)]):
        rings('Curved mushroom stem',[(0,.24,.24,x,z),(h*.5,.18,.18,x+.14,z),(h,.3,.3,x,z)],'Moon',n=12)
        rings('Luminous underside',[(h-.08,r*.95,r*.95,x,z),(h+.03,r,r,x,z)],'Amber',n=16)
        rings('Bell shaped mushroom cap',[(h,r*1.04,r*1.04,x,z),(h+.15,r,r,x,z),(h+.53,r*.7,r*.7,x-.1,z),(h+.76,r*.12,r*.12,x-.2,z)],'Violet' if i!=1 else 'Teal',n=16)
        for a in range(5):
            q=a*math.tau/5
            cylinder('Pale cap fleck',(x+math.cos(q)*r*.65,h+.46,z+math.sin(q)*r*.65),r*.105,.04,'Moon',n=8)
    for i in range(5):
        x=math.cos(i*2.4)*1.4;z=math.sin(i*2.4)*1.2
        rings('Moonstone pebble',[(0,.32,.23,x,z),(.22,.28,.2,x,z),(.34,.08,.06,x,z)],'Night',n=7)

builders={'meadow-windmill':windmill,'meadow-copse':meadow_tree,'dino-cycads':cycad,'moonwood-mushrooms':mushrooms,'dino-fossil-arch':fossil,'moonwood-observatory':moon,'rocket-courier':rocket,'space-observatory':observatory,'solar-outpost':solar,'crystal-asteroid':crystal}
manifest={'schemaVersion':1,'creator':'Literacy Guide','origin':'Original project-authored geometry; no external model or texture inputs.','tool':'Blender '+bpy.app.version_string,'source':'tools/blender/build_arcade_assets.py','sourceSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'license':'Project-owned original assets; same terms as the Literacy Guide project.','assets':[]}
for name,build in builders.items():
    scene=bpy.data.scenes.new(name); bpy.context.window.scene=scene;build()
    # Retain editable semantic objects/modifiers in the native source.
    scene.world=bpy.data.worlds.new(name+' ambient');scene.world.use_nodes=True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.28,.34,.42,1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value=.5
    bpy.ops.object.camera_add(location=v((7,5,-9)));cam=bpy.context.object;cam.name='Delivery camera'
    focus=Vector(v((0,2.65 if name in ('meadow-windmill','moonwood-observatory') else 1.6 if name!='rocket-courier' else .1,0)));cam.rotation_euler=(focus-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=6.8 if name!='rocket-courier' else 4.6;scene.camera=cam
    for label,point,power,size in [('Key',(-4,8,-5),1000,5),('Fill',(5,4,-2),600,5),('Rim',(0,6,5),1100,4)]:
        bpy.ops.object.light_add(type='AREA',location=v(point));l=bpy.context.object;l.name=label;l.data.energy=power;l.data.shape='DISK';l.data.size=size;l.rotation_euler=(focus-l.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.object.select_all(action='DESELECT')
    for o in scene.objects:
        if o.type=='MESH':o.select_set(True)
    # Join evaluated copies by material for the runtime; native semantic parts stay editable.
    originals=list(bpy.context.selected_objects)
    rotor=[o for o in originals if name=='meadow-windmill' and o.name.startswith(('Rotor spar','Woven sail','Sail batten','Axle'))]
    batches=[('Structure',[o for o in originals if o not in rotor])]
    if rotor:batches.append(('WindmillRotor',rotor))
    exports=[]
    for label,parts in batches:
        bpy.ops.object.select_all(action='DESELECT');copies=[]
        for original in parts:
            evaluated=original.evaluated_get(bpy.context.evaluated_depsgraph_get())
            copy=bpy.data.objects.new(original.name+' export',bpy.data.meshes.new_from_object(evaluated))
            scene.collection.objects.link(copy);copy.matrix_world=original.matrix_world.copy();copy.select_set(True);copies.append(copy)
        bpy.context.view_layer.objects.active=copies[0];bpy.ops.object.join();merged=bpy.context.object;merged.name=label
        if label=='WindmillRotor':
            scene.cursor.location=v((0,3.2,-1.15));bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
        exports.append(merged)
    bpy.ops.object.select_all(action='DESELECT')
    for o in exports:o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(OUT/(name+'.glb')),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_cameras=False,export_lights=False,export_animations=False)
    for o in exports:bpy.data.objects.remove(o,do_unlink=True)
    if rotor:
        pivot=bpy.data.objects.new('Windmill animated axle',None);scene.collection.objects.link(pivot);pivot.location=v((0,3.2,-1.15))
        bpy.context.view_layer.update()
        for part in rotor:
            world_matrix=part.matrix_world.copy();part.parent=pivot;part.matrix_world=world_matrix
        scene.render.fps=24;scene.frame_end=480
        pivot.rotation_euler[1]=0;pivot.keyframe_insert(data_path='rotation_euler',frame=1)
        pivot.rotation_euler[1]=-math.tau;pivot.keyframe_insert(data_path='rotation_euler',frame=481)
        for layer in pivot.animation_data.action.layers:
            for strip in layer.strips:
                for bag in strip.channelbags:
                    for curve in bag.fcurves:
                        for key in curve.keyframe_points:key.interpolation='LINEAR'
        scene.frame_set(1)
    scene.render.engine='CYCLES';scene.cycles.samples=24;scene.render.resolution_x=800;scene.render.resolution_y=800;scene.render.resolution_percentage=100
    scene.render.film_transparent=True;scene.view_settings.view_transform='AgX';scene.render.filepath=str(REVIEW/(name+'.png'))
    bpy.ops.render.render(write_still=True)
    binary=(OUT/(name+'.glb')).read_bytes()
    manifest['assets'].append({'id':name,'url':'/game-assets/arcade-blender/'+name+'.glb','bytes':len(binary),'sha256':hashlib.sha256(binary).hexdigest(),'forward':'-Z','up':'Y','textureDependencies':[]})
if 'Scene' in bpy.data.scenes and not bpy.data.scenes['Scene'].objects:
    bpy.data.scenes.remove(bpy.data.scenes['Scene'])
for mesh_data in list(bpy.data.meshes):
    if mesh_data.users == 0:bpy.data.meshes.remove(mesh_data)
bpy.context.window.scene=bpy.data.scenes['rocket-courier']
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'Arcade-worlds.blend'),compress=True)
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('ARCADE_ASSETS_COMPLETE',sum(a['bytes'] for a in manifest['assets']))
