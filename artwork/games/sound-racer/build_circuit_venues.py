"""Original textured 360-degree circuit venues, shared by Racer and Skate.

Blender --background --threads 2 --python this_file.py -- ROOT --world meadow
Each named venue is exported as an independently placed, bounded 3D template.
No full-scene illustration or external model is incorporated.
"""
import bpy, bmesh, math, os, sys, json, hashlib
from mathutils import Vector

ROOT = sys.argv[sys.argv.index('--') + 1]
WORLD = sys.argv[sys.argv.index('--world') + 1] if '--world' in sys.argv else 'meadow'
if WORLD not in ('meadow','dino','moonwood'): raise ValueError('Unknown canonical world')
SRC = os.path.join(ROOT,'source-art/arcade/sound-racer-3d/venues')
OUT = os.path.join(ROOT,'public/game-assets/sound-racer/venues')
os.makedirs(SRC,exist_ok=True); os.makedirs(OUT,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.preferences.filepaths.save_version=0
scene=bpy.context.scene
M={}; groups={}; current=None

def material(name, color, rough=.85, metal=0, texture=None, glow=0):
    color=tuple(c/12.92 if c<.04045 else ((c+.055)/1.055)**2.4 for c in color)
    m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=(*color,1)
    b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*color,1)
    b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal
    b.inputs['Emission Color'].default_value=(*color,1);b.inputs['Emission Strength'].default_value=glow
    if texture:
        im=bpy.data.images.load(texture,check_existing=True);im.pack()
        t=m.node_tree.nodes.new('ShaderNodeTexImage');t.image=im
        mul=m.node_tree.nodes.new('ShaderNodeMixRGB');mul.blend_type='MULTIPLY';mul.inputs[0].default_value=1;mul.inputs[2].default_value=(*color,1)
        m.node_tree.links.new(t.outputs['Color'],mul.inputs[1]);m.node_tree.links.new(mul.outputs[0],b.inputs['Base Color'])
    M[name]=m;return m

wood=os.path.join(ROOT,'public/game-assets/physical-arcade/burrow-builders/materials/plank-albedo-v1.webp')
stone=os.path.join(ROOT,'public/game-assets/physical-arcade/burrow-builders/materials/stone-albedo-v1.webp')
material('OakGrain',(.93,.78,.54),texture=wood)
material('DarkTimber',(.62,.44,.28),texture=wood)
material('WeatheredStone',(.97,.92,.77),texture=stone)
material('CreamPlaster',(.97,.88,.67))
material('CanopyIvory',(.99,.94,.78),.94)
material('TealTiles',{'meadow':(.14,.52,.53),'dino':(.63,.34,.19),'moonwood':(.39,.30,.55)}[WORLD],.75)
material('WorldAccent',{'meadow':(.92,.42,.30),'dino':(.28,.50,.56),'moonwood':(.92,.72,.35)}[WORLD],.76)
material('DarkGlass',{'meadow':(.23,.42,.49),'dino':(.29,.34,.35),'moonwood':(.24,.21,.38)}[WORLD],.26,.12)
material('AmberGlass',(.98,.77,.41),.36,.12,glow=.45 if WORLD=='moonwood' else .08)
material('SoftLeaf',{'meadow':(.38,.62,.26),'dino':(.24,.52,.29),'moonwood':(.24,.41,.43)}[WORLD],.94)
material('FlowerPetal',{'meadow':(.96,.77,.32),'dino':(.96,.61,.38),'moonwood':(.68,.53,.84)}[WORLD],.94)
material('FlowerPink',{'meadow':(.92,.43,.42),'dino':(.91,.82,.50),'moonwood':(.79,.72,.92)}[WORLD],.94)
material('Iron',(.27,.34,.36),.48,.56)
material('FossilBone',(.94,.85,.66),.84)

def begin(name):
    global current
    current=bpy.data.objects.new(name,None);scene.collection.objects.link(current);groups[name]=current

def uv(obj):
    layer=obj.data.uv_layers.new(name='OriginalVenueUV')
    for face in obj.data.polygons:
        n=face.normal;axis=max(range(3),key=lambda i:abs(n[i]))
        axes=[i for i in range(3) if i!=axis]
        for k in face.loop_indices:
            p=obj.data.vertices[obj.data.loops[k].vertex_index].co
            layer.data[k].uv=(p[axes[0]]*.42,p[axes[1]]*.42)

def mesh(name, points, faces, mat, bevel=0, smooth=False):
    d=bpy.data.meshes.new(name);d.from_pydata(points,[],faces);d.update()
    bm=bmesh.new();bm.from_mesh(d);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(d);bm.free()
    o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.parent=current;o.data.materials.append(M[mat])
    if bevel:
        bpy.context.view_layer.objects.active=o
        mod=o.modifiers.new('AuthoredSoftEdges','BEVEL');mod.width=bevel;mod.segments=3
        bpy.ops.object.modifier_apply(modifier=mod.name)
    if smooth:
        for p in o.data.polygons:p.use_smooth=True
    uv(o);return o

def box(name,c,size,mat,bevel=.05):
    a,b,d=[x/2 for x in size]
    points=[(c[0]+x*a,c[1]+y*b,c[2]+z*d) for x,y,z in [(-1,-1,-1),(-1,-1,1),(-1,1,-1),(-1,1,1),(1,-1,-1),(1,-1,1),(1,1,-1),(1,1,1)]]
    return mesh(name,points,[(0,4,6,2),(1,3,7,5),(0,1,5,4),(2,6,7,3),(0,2,3,1),(4,5,7,6)],mat,bevel)

def oval(name,c,scale,mat,cols=24,rows=16):
    pts=[];fs=[]
    for j in range(rows+1):
        p=math.pi*j/rows
        for i in range(cols):
            a=math.tau*i/cols
            pts.append((c[0]+math.sin(p)*math.cos(a)*scale[0],c[1]+math.sin(p)*math.sin(a)*scale[1],c[2]+math.cos(p)*scale[2]))
    for j in range(rows):
        for i in range(cols):fs.append((j*cols+i,j*cols+(i+1)%cols,(j+1)*cols+(i+1)%cols,(j+1)*cols+i))
    return mesh(name,pts,fs,mat,smooth=True)

def tube(name,points,radii,mat,cols=16):
    pts=[];fs=[]
    for j,c in enumerate(points):
        d=(Vector(points[min(j+1,len(points)-1)])-Vector(points[max(0,j-1)])).normalized()
        u=d.cross(Vector((0,0,1)))
        if u.length<.01:u=d.cross(Vector((0,1,0)))
        u.normalize();v=d.cross(u)
        for i in range(cols):pts.append(Vector(c)+(u*math.cos(i*math.tau/cols)+v*math.sin(i*math.tau/cols))*radii[j])
    for j in range(len(points)-1):
        for i in range(cols):fs.append((j*cols+i,j*cols+(i+1)%cols,(j+1)*cols+(i+1)%cols,(j+1)*cols+i))
    fs.extend([tuple(reversed(range(cols))),tuple((len(points)-1)*cols+i for i in range(cols))])
    return mesh(name,pts,fs,mat,smooth=True)

def beam(name,a,b,r,mat):return tube(name,[a,b],[r,r],mat)

def leaf(name,c,scale,mat,angle=0):
    pts=[];fs=[];rows=8;cols=8
    for j in range(rows+1):
        t=j/rows
        for i in range(cols+1):
            q=-1+2*i/cols;width=math.sin(t*math.pi)*scale[0]
            x=q*width;y=t*scale[1];z=math.sin(t*math.pi)*.11+q*q*.02
            pts.append((c[0]+x*math.cos(angle)-y*math.sin(angle),c[1]+x*math.sin(angle)+y*math.cos(angle),c[2]+z*scale[2]))
    for j in range(rows):
        for i in range(cols):
            a=j*(cols+1)+i;fs.append((a,a+1,a+cols+2,a+cols+1))
    return mesh(name,pts,fs,mat,smooth=True)

def arch(name,c,r,width,depth,mat,start=0,end=math.pi,steps=32):
    pts=[];fs=[]
    for j in range(steps+1):
        a=start+(end-start)*j/steps
        for z in [-depth/2,depth/2]:
            for rad in [r-width/2,r+width/2]:pts.append((c[0]+math.cos(a)*rad,c[1]+z,c[2]+math.sin(a)*rad))
    for j in range(steps):
        a=j*4;b=a+4
        for k,l in [(0,1),(2,3),(0,2),(1,3)]:fs.append((a+k,b+k,b+l,a+l))
    fs.extend([(0,2,3,1),(steps*4,steps*4+1,steps*4+3,steps*4+2)])
    return mesh(name,pts,fs,mat,.025,True)

def planter(x,y,z,span=1.1):
    box('TimberFlowerBox',(x,y,z+.18),(span,.64,.36),'OakGrain',.055)
    box('DarkSoil',(x,y,z+.365),(span-.13,.49,.03),'DarkTimber',.02)
    for i in range(5):
        fx=x+(i-2)*span/6;fy=y+math.sin(i*3)*.11
        beam('FlowerStalk',(fx,fy,z+.36),(fx,fy,z+.73),.023,'SoftLeaf')
        leaf('FlowerLeaf',(fx,fy,z+.49),(.10,.29,1),'SoftLeaf',i*1.3)
        for k in range(5):
            a=math.tau*k/5
            oval('RoundedPetal',(fx+math.cos(a)*.105,fy+math.sin(a)*.105,z+.75),(.082,.065,.032),'FlowerPetal' if i%2 else 'FlowerPink',12,8)
        oval('FlowerHeart',(fx,fy,z+.775),(.037,.037,.032),'AmberGlass',12,8)

def window(x,y,z,span=.9):
    box('RecessedWindow',(x,y,z),(span,.09,1.05),'DarkGlass',.09)
    for sx in [-1,1]:box('WindowOakUpright',(x+sx*(span/2+.035),y-.05,z),(.09,.12,1.18),'OakGrain',.025)
    for h in [-.56,.56,0]:box('WindowCrossbar',(x,y-.052,z+h),(span+.15,.12,.075),'OakGrain',.02)
    box('WindowSill',(x,y-.12,z-.59),(span+.35,.34,.13),'WeatheredStone',.03)

def bunting(a,b,n=9):
    points=[]
    for i in range(n+1):
        t=i/n;p=Vector(a).lerp(Vector(b),t);p.z-=math.sin(t*math.pi)*.24;points.append(p)
    tube('CottonBuntingCord',points,[.019]*(n+1),'CanopyIvory',8)
    for i in range(n):
        c=points[i].lerp(points[i+1],.5)
        mesh('SewnPennant',[(c.x-.13,c.y,c.z),(c.x+.13,c.y,c.z),(c.x,c.y-.015,c.z-.32)],[(0,1,2)],'WorldAccent' if i%2 else 'CanopyIvory')

def clubhouse():
    begin('clubhouse')
    box('StoneClubFooting',(0,0,.20),(6.6,4.6,.4),'WeatheredStone',.12)
    box('SoftPlasterBuilding',(0,0,1.72),(5.9,3.9,3.05),'CreamPlaster',.14)
    for x in [-2.96,0,2.96]:box('ExposedOakUpright',(x,-1.987,1.73),(.17,.17,3.1),'DarkTimber',.055)
    for z in [.52,2.82]:box('FrontTimberCourse',(0,-2.02,z),(6.15,.18,.17),'DarkTimber',.045)
    for x in [-1.62,1.62]:window(x,-2.022,1.75)
    box('ArchedDoorPanel',(0,-2.075,1.2),(.93,.13,1.7),'OakGrain',.16)
    arch('DoorRoundedLintel',(0,-2.16,1.81),.50,.11,.15,'DarkTimber')
    oval('BrassDoorLatch',(.31,-2.165,1.16),(.050,.030,.050),'AmberGlass',16,10)
    for y in [-1.55,-.80,0,.80,1.55]:beam('RaisedRoofRafter',(-3.4,y,3.0),(0,y,4.56),.095,'DarkTimber');beam('RaisedRoofRafter',(0,y,4.56),(3.4,y,3.0),.095,'DarkTimber')
    for side in [-1,1]:
        for i in range(9):
            x0=side*i*3.4/9;x1=side*(i+1)*3.4/9
            z0=4.57-abs(x0)*.46;z1=4.57-abs(x1)*.46
            mesh('OverlappingRoofCourse',[(x0,-2.38,z0),(x0,2.38,z0),(x1,2.38,z1),(x1,-2.38,z1)],[(0,1,2,3)],'TealTiles',.025)
            beam('RoofTileSoftSeam',(x1,-2.38,z1+.025),(x1,2.38,z1+.025),.027,'TealTiles')
    beam('RoofRidgeCap',(0,-2.48,4.60),(0,2.48,4.60),.14,'TealTiles')
    for x in [-3.5,3.5]:beam('PorchColumn',(x,-3.18,.25),(x,-3.18,2.78),.10,'OakGrain')
    mesh('PorchWovenCanopy',[(-3.62,-3.30,2.81),(3.62,-3.30,2.81),(3.1,-2.04,3.24),(-3.1,-2.04,3.24)],[(0,1,2,3)],'CanopyIvory')
    bunting((-3.45,-3.34,2.81),(3.45,-3.34,2.81),13)
    for x in [-2.3,2.3]:planter(x,-2.62,.25,1.28)
    if WORLD=='dino':
        for x in [-2.3,2.3]:arch('ClubFossilRib',(x,2.0,1.6),.8,.13,.13,'FossilBone',steps=22)
        for x in [-3.2,3.2]:leaf('ClubTropicalFrond',(x,0,.38),(.62,2.0,4),'SoftLeaf',x*.6)
    if WORLD=='moonwood':
        for x in [-3.45,3.45]:lantern(x,-3.18,2.40)
        oval('ObservatoryDome',(0,.48,4.58),(1.38,1.38,.83),'TealTiles',40,24)
        beam('TelescopeTube',(.0,-.14,4.80),(.0,-1.45,5.35),.15,'Iron')

def lantern(x,y,z):
    box('WarmGlassLantern',(x,y,z),(.30,.30,.45),'AmberGlass',.035)
    for sx in [-1,1]:
        for sy in [-1,1]:beam('LanternBrassFrame',(x+sx*.17,y+sy*.17,z-.26),(x+sx*.17,y+sy*.17,z+.26),.027,'Iron')
    box('LanternCap',(x,y,z+.28),(.43,.43,.075),'TealTiles',.04)
    arch('LanternHandle',(x,y,z+.40),.13,.027,.025,'Iron')

def grandstand():
    begin('grandstand')
    for row in range(3):
        z=.26+row*.49;y=.22+row*.77
        for p in range(4):box('TieredTimberSeat',(0,y+(p-1.5)*.12,z),(5.5,.105,.15),'OakGrain',.023)
        for x in [-2.4,2.4]:beam('SeatSupport',(x,y,.02),(x,y,z),.07,'DarkTimber')
    for x in [-2.87,2.87]:
        beam('StandPavilionPost',(x,-.34,.0),(x,-.34,3.20),.10,'OakGrain')
        beam('StandRearPavilionPost',(x,2.1,.0),(x,2.1,3.20),.10,'OakGrain')
    # Thick cloth strips form a shallow pitched canopy, readable from all sides.
    for i in range(14):
        x0=-3.2+i*6.4/14;x1=x0+6.4/14
        mesh('StripedCottonRoof',[(x0,-.68,3.12),(x1,-.68,3.12),(x1,.85,3.63),(x0,.85,3.63),(x0,2.4,3.12),(x1,2.4,3.12)],[(0,1,2,3),(3,2,5,4)],'WorldAccent' if i%2 else 'CanopyIvory')
    bunting((-2.9,-.68,3.10),(2.9,-.68,3.10),11)
    for x in [-3.25,3.25]:planter(x,-.12,0,.93)
    if WORLD=='moonwood':
        for x in [-2.87,2.87]:lantern(x,-.34,2.7)

def bench():
    begin('bench')
    for i in range(4):box('OakSeatSlat',(0,-.15+i*.14,.64),(2.5,.12,.15),'OakGrain',.034)
    for z in [.9,1.13,1.36]:box('CurvedBackSlat',(0,.43,z),(2.5,.12,.16),'OakGrain',.04)
    for x in [-1.02,1.02]:
        beam('ForgedBenchLeg',(x,-.32,0),(x,-.32,.63),.065,'Iron')
        beam('ForgedBenchBackLeg',(x,.37,0),(x,.44,1.39),.065,'Iron')
        tube('CurvedBenchArm',[(x,-.39,.63),(x,-.36,.92),(x,.05,1.04),(x,.44,.96)],[.055]*4,'Iron')

def flowerbed():
    begin('flowerbed');planter(0,0,0,2.35)
    for x in [-1.07,1.07]:box('PlanterJoinery',(x,-.332,.20),(.09,.055,.33),'DarkTimber',.025)

clubhouse();grandstand();bench();flowerbed()
# The landmark uses a separate source namespace: these functions still resolve
# their original helpers/materials consistently, independent of this kit.
# Install globals together rather than evaluating a function in mixed globals.
def retained_landmark():
    global current
    begin('landmark');path=os.path.join(ROOT,'tools/blender/build_arcade_assets.py');text=open(path).read()
    ns={'bpy':bpy,'bmesh':bmesh,'math':math,'Vector':Vector,'__file__':path}
    exec(compile(text[text.index('def v('):text.index('sys.path.insert(')],path,'exec'),ns)
    old=set(scene.objects);ns[{'meadow':'windmill','dino':'fossil','moonwood':'moon'}[WORLD]]()
    rename={'Wood':'DarkTimber','WoodLight':'OakGrain','Stone':'WeatheredStone','StoneLight':'WeatheredStone','Ivory':'CreamPlaster','Teal':'TealTiles','Sail':'CanopyIvory','Leaf':'SoftLeaf','LeafLight':'SoftLeaf','LeafDark':'SoftLeaf','Bone':'FossilBone','Gold':'WorldAccent','Window':'DarkGlass','Amber':'AmberGlass','Night':'DarkTimber','Violet':'TealTiles','Moon':'CanopyIvory'}
    for obj in set(scene.objects)-old:
        if obj.type!='MESH':continue
        obj.parent=current
        obj.data.materials[0]=M[rename.get(obj.data.materials[0].name.split('.')[0],'WeatheredStone')]
        bpy.context.view_layer.objects.active=obj
        for mod in list(obj.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
        for p in obj.data.polygons:p.use_smooth=True
        uv(obj)
retained_landmark()

# Keep separately named editable surfaces before joining only runtime siblings.
blend=os.path.join(SRC,WORLD+'-circuit-venues-v1.blend')
bpy.ops.wm.save_as_mainfile(filepath=blend)
for name,group in groups.items():
    for material_name in M:
        objects=[o for o in group.children if o.type=='MESH' and o.data.materials and o.data.materials[0].name==material_name]
        if not objects:continue
        bpy.ops.object.select_all(action='DESELECT')
        for o in objects:o.select_set(True)
        bpy.context.view_layer.objects.active=objects[0]
        if len(objects)>1:bpy.ops.object.join()
        objects[0].name=name+'_'+material_name
bpy.ops.object.select_all(action='SELECT')
out=os.path.join(OUT,WORLD+'-circuit-venues-v1.glb')
bpy.ops.export_scene.gltf(filepath=out,export_format='GLB',export_yup=True,export_animations=False,export_materials='EXPORT')
report={'schemaVersion':1,'world':WORLD,'status':'Authored native venue bank; browser composition/performance verification pending','source':'artwork/games/sound-racer/build_circuit_venues.py','sourceSha256':hashlib.sha256(open(__file__,'rb').read()).hexdigest(),'editable':'source-art/arcade/sound-racer-3d/venues/'+os.path.basename(blend),'runtime':'/game-assets/sound-racer/venues/'+os.path.basename(out),'sha256':hashlib.sha256(open(out,'rb').read()).hexdigest(),'bytes':os.path.getsize(out),'templates':list(groups),'inputs':['tools/blender/build_arcade_assets.py','public/game-assets/physical-arcade/burrow-builders/materials/plank-albedo-v1.webp','public/game-assets/physical-arcade/burrow-builders/materials/stone-albedo-v1.webp'],'axis':'Runtime +Y up, -Z front; each independently placed template starts at ground','ownership':'Original LiteracyPath authored geometry and original retained albedo material sources. No external asset model.'}
open(os.path.join(SRC,WORLD+'-circuit-venues-v1.json'),'w').write(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
