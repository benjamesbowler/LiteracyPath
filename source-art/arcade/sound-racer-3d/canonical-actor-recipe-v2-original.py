"""Original canonical 360-degree drivers on the retained Sound Racer contact rig.

Blender --background --python this_file.py -- ROOT --world meadow
All three original drivers retain the complete original kart/contact/clip recipe.
The old editable/source/runtime files are never overwritten by this exporter.
"""
import bpy, math, sys, os, json, hashlib
from mathutils import Vector

ROOT = sys.argv[sys.argv.index('--') + 1]
world = sys.argv[sys.argv.index('--world') + 1] if '--world' in sys.argv else 'meadow'
CHARACTERS = {'meadow': ('bouncy', 'Bouncy'), 'dino': ('chompy', 'Chompy'), 'moonwood': ('pip', 'Pip')}
if world not in CHARACTERS:
    raise ValueError('Expected meadow, dino or moonwood')
character_id, character = CHARACTERS[world]
baseline = os.path.join(ROOT, 'artwork/games/sound-racer/build_racer.py')
recipe = open(baseline).read()
# The original vehicle, semantic contact bones and IK clips remain the source
# authority. New driver forms below are real skinned surfaces, not billboards.
exec(compile(recipe.split('# Pip: hooded')[0], baseline, 'exec'), globals())
SRC = os.path.join(ROOT, 'source-art/arcade/sound-racer-3d')
OUT = os.path.join(ROOT, 'public/game-assets/sound-racer/models')
os.makedirs(SRC, exist_ok=True)
os.makedirs(OUT, exist_ok=True)

def authored_material(name, color, rough=.8, metal=0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.diffuse_color = (*color, 1)
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = metal
    materials[name] = mat
    return mat

def uv_material(name, filename, roughness=.9):
    mat = authored_material(name, (1,1,1), roughness)
    image = bpy.data.images.load(os.path.join(SRC, filename))
    image.pack()
    texture = mat.node_tree.nodes.new('ShaderNodeTexImage')
    texture.image = image
    mat.node_tree.links.new(texture.outputs['Color'], mat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
    return mat

if world == 'meadow': uv_material('GoldenPlushWool', 'bouncy-wool-runtime-v1.jpg', .94)
if world == 'dino': uv_material('OrangeDinosaurVelour', 'chompy-scale-runtime-v1.jpg', .87)
if world == 'moonwood': uv_material('GreenWovenTunic', 'pip-cloth-runtime-v1.jpg', .92)

authored_material('WarmCreamFace', (.96, .77, .52), .84)
authored_material('EarVelour', (.72, .245, .12), .91)
authored_material('RedWovenScarf', (.64, .025, .025), .91)
authored_material('BrownSuedeHoof', (.23, .115, .046), .91)
authored_material('EyeIvory', (.97, .97, .92), .35)
authored_material('WarmIris', (.19, .065, .019), .32)
authored_material('SoftMouth', (.095, .022, .010), .65)
paint = materials['Paint'].node_tree.nodes.get('Principled BSDF')
kart_color = {'meadow':(.022,.39,.36), 'dino':(.025,.30,.48), 'moonwood':(.36,.13,.40)}[world]
paint.inputs['Base Color'].default_value = (*kart_color, 1)
paint.inputs['Roughness'].default_value = .38
paint.inputs['Metallic'].default_value = .16
materials['Paint'].diffuse_color = (*kart_color, 1)
# The old racing seat's high black back hid the canonical scarf/body. A real
# low upholstered seat preserves the cushion/hips contact, exposing the actor.
for obj in scene.objects:
    if obj.name.startswith('SeatBack'):
        for vertex in obj.data.vertices:
            vertex.co.z = .87 + (vertex.co.z-1.02)*(.27/.49)
    if obj.name.startswith('SeatStitch'):
        for vertex in obj.data.vertices:
            vertex.co.z = min(1.13, vertex.co.z)
rig.name = character + 'KartRig'
rig.data.name = character + 'KartSemanticRig'


original_mesh = mesh
def mesh(name, verts, faces, mat, bone, sub=0):
    obj = original_mesh(name, verts, faces, mat, bone, sub)
    if mat not in ('GoldenPlushWool','OrangeDinosaurVelour','GreenWovenTunic'): return obj
    uv = obj.data.uv_layers.new(name='OriginalMaterialUV')
    points = [v.co for v in obj.data.vertices]
    lo = Vector(tuple(min(p[i] for p in points) for i in range(3)))
    hi = Vector(tuple(max(p[i] for p in points) for i in range(3)))
    c = (lo + hi) / 2
    r = hi - lo
    for loop in obj.data.loops:
        p = obj.data.vertices[loop.vertex_index].co - c
        # Continuous polar wrapping for organic surfaces. All material maps
        # belong to this parsed model; no view-dependent face projection.
        u = math.atan2(p.y / max(.001, r.y), p.x / max(.001, r.x)) / math.tau + .5
        v = (p.z / max(.001, r.z)) + .5
        uv.data[loop.index].uv = (u * 2, v * 1.4) if mat == 'GoldenPlushWool' else (u, v)
    return obj

def wool_volume(name, center, scale, bone, curls=74, rows=32, segments=64):
    """One continuous sculpted shell with integrated wool clumps and fine UV art."""
    directions = []
    golden = math.pi * (3 - math.sqrt(5))
    for k in range(curls):
        z = 1 - 2 * (k + .5) / curls
        r = math.sqrt(max(0, 1 - z*z))
        directions.append(Vector((r*math.cos(k*golden), r*math.sin(k*golden), z)))
    verts, faces = [], []
    for j in range(rows+1):
        polar = math.pi*j/rows
        for i in range(segments):
            angle = math.tau*i/segments
            d = Vector((math.sin(polar)*math.cos(angle), math.sin(polar)*math.sin(angle), math.cos(polar)))
            bump = sum(math.exp(-max(0, 1-d.dot(q))/.0105) for q in directions)
            radius = 1 + .185*bump
            verts.append(tuple(center[k] + d[k]*scale[k]*radius for k in range(3)))
    for j in range(rows):
        for i in range(segments):
            faces.append((j*segments+i, j*segments+(i+1)%segments, (j+1)*segments+(i+1)%segments, (j+1)*segments+i))
    return mesh(name, verts, faces, 'GoldenPlushWool', bone)

def leaf(name, centers, widths, depths, material, bone):
    verts, faces = [], []
    segments = 24
    for j, point in enumerate(centers):
        direction = Vector(centers[min(j+1,len(centers)-1)]) - Vector(centers[max(0,j-1)])
        direction.normalize()
        normal = Vector((0,1,0))
        across = normal.cross(direction).normalized()
        for k in range(segments):
            a = math.tau*k/segments
            verts.append(Vector(point) + across*math.cos(a)*widths[j] + normal*math.sin(a)*depths[j])
    for j in range(len(centers)-1):
        for k in range(segments):
            faces.append((j*segments+k,j*segments+(k+1)%segments,(j+1)*segments+(k+1)%segments,(j+1)*segments+k))
    faces.extend([tuple(reversed(range(segments))),tuple((len(centers)-1)*segments+k for k in range(segments))])
    return mesh(name, verts, faces, material, bone, 0)

def add_bouncy():
    wool_volume('BouncyContinuousBody', (0,-.35,1.10), (.345,.28,.34), 'chest', curls=58, rows=28, segments=56)
    wool_volume('BouncySoftNeck', (0,-.39,1.445), (.23,.205,.18), 'neck', curls=26, rows=16, segments=36)
    wool_volume('BouncyContinuousWoolHead', (0,-.38,1.845), (.415,.35,.415), 'head')
    oval('BouncyCreamFace', (0,-.13,1.79), (.303,.211,.303), 'WarmCreamFace', 'head', 40, 26)
    oval('BouncySoftMuzzle', (0,.041,1.724), (.163,.084,.108), 'WarmCreamFace', 'head', 28, 18)
    for side, s in [('L',-1),('R',1)]:
        centers = [(s*.31,-.365,1.91),(s*.44,-.34,1.84),(s*.59,-.32,1.75),(s*.73,-.30,1.68),(s*.80,-.30,1.65)]
        leaf('BouncyFloppyEar.'+side, centers, [.043,.115,.124,.075,.012], [.028,.048,.049,.029,.009], 'WarmCreamFace', 'head')
        inner = [(p[0],p[1]+.043,p[2]+.004) for p in centers[1:]]
        leaf('BouncyEarVelour.'+side, inner, [.061,.080,.043,.008], [.005,.005,.005,.003], 'EarVelour', 'head')
        oval('BouncyEyeWhite.'+side, (s*.125,.036,1.866), (.085,.022,.113), 'EyeIvory', 'head', 28, 20)
        oval('BouncyWarmIris.'+side, (s*.126,.057,1.864), (.053,.010,.078), 'WarmIris', 'head', 24, 16)
        oval('BouncyPupil.'+side, (s*.126,.066,1.864), (.034,.009,.055), 'Ink', 'head', 24, 16)
        oval('BouncyEyeGlint.'+side, (s*.109,.075,1.893), (.013,.006,.021), 'EyeIvory', 'head', 16, 10)
        tube('BouncyBrow.'+side, [(s*.064,.017,2.00),(s*.13,.019,2.023),(s*.192,.001,2.002)], [.010,.014,.008], 'BrownSuedeHoof', 'head', 10)
    oval('BouncySoftNose', (0,.130,1.748), (.067,.037,.040), 'BrownSuedeHoof', 'head', 24, 16)
    oval('BouncySmileInterior', (0,.063,1.648), (.077,.022,.045), 'SoftMouth', 'head', 24, 16)
    tube('BouncySmileLip', [(-.078,.061,1.669),(-.043,.086,1.635),(0,.089,1.625),(.042,.086,1.637),(.077,.060,1.671)], [.009]*5, 'BrownSuedeHoof', 'head', 10)
    oval('BouncyTongue', (0,.083,1.633), (.037,.008,.013), 'EarVelour', 'head', 16, 10)

    rings('BouncyScarfCollar', [(0,-.37,z) for z in [1.41,1.445,1.49]], [(.249,.224),(.253,.224),(.232,.207)], 'RedWovenScarf', 'neck', 40, 1)
    rings('BouncyFoldedNeckerchief', [(0,y,z) for y,z in [(-.120,1.47),(-.086,1.42),(-.033,1.32),(.008,1.235)]], [(.22,.034),(.197,.033),(.13,.029),(.005,.013)], 'RedWovenScarf', 'neck', 28, 1)
    oval('BouncyScarfKnot', (0,-.609,1.443), (.064,.060,.072), 'RedWovenScarf', 'neck', 24, 16)
    for s in [-1,1]:
        leaf('BouncyScarfTail', [(s*.01,-.624,1.44),(s*.10,-.654,1.365),(s*.22,-.676,1.26)], [.031,.052,.003], [.020,.018,.003], 'RedWovenScarf', 'neck')

    for side, s in [('L',-1),('R',1)]:
        for part, radii in [('upperarm',(.116,.103)),('forearm',(.102,.082))]:
            a,b,_ = bones[part+'.'+side]
            limb('BouncyWool'+part+'.'+side,a,b,*radii,'GoldenPlushWool',part+'.'+side)
        oval('BouncyGrippingHoof.'+side,(s*.232,.233,1.018),(.086,.070,.063),'BrownSuedeHoof','hand.'+side,24,16)
        # Exactly two springs, each a continuous helical tube, with a real attached
        # foot. Skin both halves against the original seated thigh/shin contact chain.
        points = []
        turns, samples = 6, 85
        hip = Vector(bones['thigh.'+side][0])
        knee = Vector(bones['shin.'+side][0])
        ankle = Vector(bones['foot.'+side][0])
        for k in range(samples):
            t = k/(samples-1)
            center = hip.lerp(knee,t*2) if t < .5 else knee.lerp(ankle,(t-.5)*2)
            direction = (knee-hip if t<.5 else ankle-knee).normalized()
            u = direction.cross(Vector((0,0,1))).normalized()
            v = direction.cross(u).normalized()
            radius = .081*(.74+.26*math.sin(t*math.pi))
            points.append(center + (u*math.cos(t*math.tau*turns)+v*math.sin(t*math.tau*turns))*radius)
        spring = tube('BouncyCoilLeg.'+side,points,[.025]*samples,'Metal','thigh.'+side,10)
        spring.vertex_groups.clear()
        thigh = spring.vertex_groups.new(name='thigh.'+side)
        shin = spring.vertex_groups.new(name='shin.'+side)
        for vertex in spring.data.vertices:
            row = vertex.index//10
            t = row/(samples-1)
            weight = max(0,min(1,(.57-t)/.14))
            if weight>0: thigh.add([vertex.index],weight,'REPLACE')
            if weight<1: shin.add([vertex.index],1-weight,'REPLACE')
        rings('BouncyAttachedFoot.'+side,[(s*.25,.78,z) for z in [.31,.34,.40,.475]],[(.115,.20),(.12,.22),(.12,.20),(.080,.11)],'BrownSuedeHoof','foot.'+side,24,1)
        rings('BouncySole.'+side,[(s*.25,.79,z) for z in [.298,.335]],[(.124,.221),(.124,.221)],'BrownSuedeHoof','foot.'+side,24,0)

def add_eyes(prefix, side, s, center, white_scale, iris_color='WarmIris'):
    x,y,z=center
    oval(prefix+'EyeWhite.'+side, center, white_scale, 'EyeIvory', 'head', 28, 18)
    oval(prefix+'Iris.'+side,(x,y+.020,z),(.057,.012,.077),iris_color,'head',24,16)
    oval(prefix+'Pupil.'+side,(x,y+.030,z),(.032,.008,.058),'Ink','head',24,16)
    oval(prefix+'Glint.'+side,(x-s*.016,y+.039,z+.033),(.014,.006,.020),'EyeIvory','head',16,10)

def add_chompy():
    authored_material('CreamBandana',(.96,.84,.61),.92)
    authored_material('DinoBelly',(.97,.73,.40),.86)
    authored_material('DinoDorsal',(.63,.21,.052),.87)
    authored_material('DinoNail',(.97,.86,.68),.7)
    # Continuous large rounded dinosaur forms, with a protruding soft snout,
    # separately sculpted cheeks/nostrils and a tapered articulated tail.
    oval('ChompyRoundedTorso',(0,-.37,1.10),(.365,.315,.39),'OrangeDinosaurVelour','chest',44,28)
    oval('ChompyCreamBelly',(0,-.091,1.08),(.26,.083,.30),'DinoBelly','chest',36,24)
    oval('ChompyNeck',(0,-.38,1.45),(.235,.25,.24),'OrangeDinosaurVelour','neck',32,22)
    oval('ChompyFullHead',(0,-.30,1.865),(.435,.385,.435),'OrangeDinosaurVelour','head',48,30)
    oval('ChompySoftMuzzle',(0,.045,1.745),(.342,.273,.209),'OrangeDinosaurVelour','head',40,26)
    oval('ChompyLowerJaw',(0,.064,1.639),(.30,.227,.105),'DinoBelly','head',36,24)
    for side,s in [('L',-1),('R',1)]:
        add_eyes('Chompy',side,s,(s*.193,.066,1.966),(.107,.040,.137))
        oval('ChompyCheek.'+side,(s*.295,.108,1.754),(.090,.063,.104),'OrangeDinosaurVelour','head',28,18)
        oval('ChompyNostril.'+side,(s*.125,.300,1.808),(.021,.011,.016),'DinoDorsal','head',16,10)
        tube('ChompyBrow.'+side,[(s*.110,.077,2.117),(s*.198,.065,2.136),(s*.272,.015,2.105)],[.018,.026,.013],'DinoDorsal','head',10)
    tube('ChompySmile',[(-.21,.231,1.680),(-.12,.291,1.655),(0,.301,1.640),(.12,.291,1.655),(.21,.231,1.680)],[.010]*5,'SoftMouth','head',10)
    for z,y,r in [(2.205,-.37,.095),(2.120,-.60,.112),(1.94,-.685,.104),(1.72,-.658,.079)]:
        leaf('ChompyRoundedDorsal',[(0,y+.034,z-.057),(0,y-r*.75,z),(0,y-r,z+.066)],[r*.82,r*.60,.007],[.056,.036,.009],'DinoDorsal','head')
    leaf('ChompyCurvedTail',[(0,-.59,.90),(.03,-.84,.96),(.08,-1.10,1.00),(.14,-1.32,.95),(.21,-1.42,.83)],[.19,.18,.14,.080,.006],[.18,.16,.12,.068,.006],'OrangeDinosaurVelour','hips')
    rings('ChompyBandanaCollar',[(0,-.37,z) for z in [1.40,1.46,1.51]],[(.262,.269),(.267,.271),(.240,.248)],'CreamBandana','neck',36,1)
    rings('ChompyBandanaFront',[(0,y,z) for y,z in [(-.101,1.49),(-.040,1.42),(.015,1.29)]],[(.236,.029),(.179,.034),(.008,.014)],'CreamBandana','neck',24,1)
    oval('ChompyBandanaKnot',(0,-.646,1.456),(.07,.046,.061),'CreamBandana','neck',24,16)
    for s in [-1,1]: leaf('ChompyBandanaTie',[(s*.02,-.66,1.45),(s*.115,-.671,1.362),(s*.16,-.678,1.29)],[.040,.045,.003],[.020,.017,.003],'CreamBandana','neck')
    for side,s in [('L',-1),('R',1)]:
        for part,radii in [('upperarm',(.135,.116)),('forearm',(.116,.090)),('thigh',(.185,.157)),('shin',(.157,.102))]:
            a,b,_=bones[part+'.'+side]
            limb('Chompy'+part+'.'+side,a,b,*radii,'OrangeDinosaurVelour',part+'.'+side)
            oval('ChompySoftJoint.'+part+side,b,(radii[1],)*3,'OrangeDinosaurVelour',part+'.'+side,20,14)
        oval('ChompyGrip.'+side,(s*.232,.237,1.019),(.079,.066,.061),'OrangeDinosaurVelour','hand.'+side,28,18)
        for finger in range(3):
            x=s*(.191+finger*.039)
            tube('ChompyFinger.'+side,[(x,.222,1.049),(x,.283,1.029),(x,.28,.983)],[.019,.023,.014],'OrangeDinosaurVelour','hand.'+side,10)
        rings('ChompyFoot.'+side,[(s*.25,.78,z) for z in [.31,.35,.43,.51]],[(.128,.21),(.132,.22),(.115,.185),(.082,.11)],'OrangeDinosaurVelour','foot.'+side,28,1)
        rings('ChompyFootSole.'+side,[(s*.25,.79,z) for z in [.298,.335]],[(.133,.222),(.133,.222)],'DinoBelly','foot.'+side,24,0)
        for toe in [-1,0,1]: oval('ChompyToenail.'+side,(s*.25+toe*.073,.966,.37),(.030,.050,.036),'DinoNail','foot.'+side,16,10)

def add_pip():
    authored_material('PipSkin',(.98,.69,.45),.8)
    authored_material('PipCheek',(.86,.29,.18),.84)
    authored_material('PipGreenEye',(.19,.36,.045),.45)
    authored_material('PipHair',(.20,.071,.019),.86)
    authored_material('PipHairSheen',(.31,.135,.033),.86)
    authored_material('PipCollar',(.34,.43,.11),.94)
    # Canonical short-sleeved belted green tunic, exposed forearms, sculpted
    # round child head with pointed ears and coherent swept hair in every view.
    rings('PipShortSleeveTunic',[(0,-.35,z) for z in [.81,.86,.95,1.14,1.33,1.43,1.46]],[(.28,.23),(.31,.25),(.29,.22),(.29,.21),(.32,.215),(.29,.18),(.18,.14)],'GreenWovenTunic','chest',32,1)
    rings('PipTunicHem',[(0,-.35,z) for z in [.80,.84,.895]],[(.31,.25),(.318,.258),(.305,.247)],'PipCollar','chest',32,1)
    rings('PipLeatherBelt',[(0,-.35,z) for z in [.97,1.025]],[(.299,.235),(.294,.231)],'Leather','chest',32,0)
    oval('PipBeltBuckle',(0,-.108,1.0),(.076,.023,.047),'Cream','chest',24,16)
    oval('PipNeck',(0,-.39,1.515),(.117,.110,.167),'PipSkin','neck',28,18)
    for s in [-1,1]:
        leaf('PipSoftCollar',[(s*.02,-.140,1.36),(s*.14,-.14,1.43),(s*.17,-.29,1.485)],[.040,.047,.028],[.017,.022,.014],'PipCollar','chest')
    rings('PipSculptedFace',[(0,-.35,z) for z in [1.55,1.59,1.68,1.81,1.98,2.09,2.14]],[(.13,.13),(.21,.195),(.30,.251),(.335,.29),(.312,.276),(.221,.201),(.045,.045)],'PipSkin','head',48,1)
    for side,s in [('L',-1),('R',1)]:
        leaf('PipPointedSoftEar.'+side,[(s*.292,-.35,1.86),(s*.383,-.34,1.84),(s*.51,-.35,1.982)],[.059,.092,.004],[.055,.042,.004],'PipSkin','head')
        leaf('PipEarInside.'+side,[(s*.340,-.295,1.865),(s*.412,-.295,1.894),(s*.48,-.332,1.964)],[.035,.043,.003],[.005,.005,.002],'PipCheek','head')
        add_eyes('Pip',side,s,(s*.130,-.060,1.874),(.091,.019,.112),'PipGreenEye')
        oval('PipRosyCheek.'+side,(s*.229,-.112,1.756),(.046,.006,.028),'PipCheek','head',18,12)
        tube('PipSoftBrow.'+side,[(s*.063,-.10,2.008),(s*.132,-.060,2.028),(s*.210,-.088,2.0)],[.018,.025,.014],'PipHair','head',12)
    oval('PipNose',(0,-.029,1.771),(.066,.074,.062),'PipSkin','head',28,18)
    tube('PipSmile',[(-.082,-.104,1.69),(0,-.073,1.658),(.080,-.104,1.691)],[.009,.013,.009],'SoftMouth','head',12)
    verts,faces=[],[]
    cols,rows=52,22
    for j in range(rows+1):
        for i in range(cols):
            a=math.tau*i/cols
            front=max(0,math.sin(a));back=max(0,-math.sin(a))
            edge=1.70-.58*front+.69*back+.06*math.sin(5*a)*front
            p=edge*j/rows
            verts.append((.364*math.sin(p)*math.cos(a),-.39+.32*math.sin(p)*math.sin(a),1.91+.345*math.cos(p)+.032*math.sin(a-.7)*math.sin(p)))
    for j in range(rows):
        for i in range(cols): faces.append((j*cols+i,j*cols+(i+1)%cols,(j+1)*cols+(i+1)%cols,(j+1)*cols+i))
    mesh('PipContinuousSweptHair',verts,faces,'PipHair','head')
    for strand in range(11):
        a=math.pi+.10+strand*(math.pi-.20)/10
        points=[]
        for j in range(9):
            t=j/8;p=.40+2*t;az=a+.22*math.sin(t*math.pi)
            points.append((.369*math.sin(p)*math.cos(az),-.39+.326*math.sin(p)*math.sin(az),1.91+.35*math.cos(p)))
        leaf('PipSculptedNapeLock',points,[.040+.017*math.sin(j/8*math.pi) if j<8 else .002 for j in range(9)],[.012]*8+[.003],'PipHairSheen' if strand%4==0 else 'PipHair','head')
    for index,(x,drop) in enumerate([(-.24,.08),(-.10,.035),(.055,.005),(.205,.035)]):
        leaf('PipForeheadSweep',[(x-.054,-.20,2.23),(x+.026,-.054,2.127),(x+.072,-.056,1.99-drop)],[.072,.078,.002],[.029,.038,.002],'PipHairSheen' if index==1 else 'PipHair','head')
    for side,s in [('L',-1),('R',1)]:
        tube('PipSideburn.'+side,[(s*.308,-.30,2.01),(s*.325,-.30,1.865),(s*.29,-.29,1.81)],[.074,.067,.013],'PipHair','head',14)
        a,b,_=bones['upperarm.'+side]
        a,b=Vector(a),Vector(b)
        limb('PipShortSleeve.'+side,a,a.lerp(b,.48),.156,.147,'GreenWovenTunic','upperarm.'+side)
        limb('PipExposedUpperArm.'+side,a.lerp(b,.42),b,.098,.096,'PipSkin','upperarm.'+side)
        for part,mat,rs in [('forearm','PipSkin',(.098,.078)),('thigh','Leather',(.145,.13)),('shin','Leather',(.115,.085))]:
            a,b,_=bones[part+'.'+side]
            limb('Pip'+part+'.'+side,a,b,*rs,mat,part+'.'+side)
            oval('PipJoint.'+part+side,b,(rs[1],)*3,mat,part+'.'+side,20,12)
        oval('PipGrippingPalm.'+side,(s*.232,.234,1.018),(.076,.064,.052),'PipSkin','hand.'+side,24,16)
        for finger in range(4):
            x=s*(.19+finger*.025)
            tube('PipFinger.'+side,[(x,.22,1.043),(x,.276,1.034),(x,.284,.989),(x,.257,.978)],[.015,.016,.012,.009],'PipSkin','hand.'+side,8)
        tube('PipThumb.'+side,[(s*.177,.217,1.017),(s*.168,.25,1.0),(s*.187,.269,.991)],[.022,.019,.014],'PipSkin','hand.'+side,10)
        rings('PipBoot.'+side,[(s*.25,.78,z) for z in [.31,.34,.40,.51]],[(.115,.20),(.12,.22),(.115,.20),(.085,.10)],'LeatherLight','foot.'+side,24,1)
        rings('PipBootSole.'+side,[(s*.25,.79,z) for z in [.298,.335]],[(.124,.221),(.124,.221)],'Leather','foot.'+side,24,0)
        rings('PipBootCuff.'+side,[(s*.25,.66,z) for z in [.47,.515]],[(.096,.106),(.096,.106)],'PipCollar','foot.'+side,24,0)
        for y in [.76,.81,.86]: tube('PipBootLace',[(s*.25-.065,y,.445),(s*.25+.065,y,.445)],[.009,.009],'Leather','foot.'+side,8)

{'meadow':add_bouncy,'dino':add_chompy,'moonwood':add_pip}[world]()

# Bake the exact six contact-constrained states from the existing recipe.
clips = recipe[recipe.index('# Keyframed analytic seated contacts.'):recipe.index('# Keep individual named mesh surfaces editable')]
exec(compile(clips, baseline, 'exec'), globals())
scene.frame_set(1)
for track in rig.animation_data.nla_tracks: track.mute=True
blend = os.path.join(SRC,character_id+'-kart-v2.blend')
bpy.ops.wm.save_as_mainfile(filepath=blend)
for material in materials:
    objects = [obj for obj in list(scene.objects) if obj.type=='MESH' and obj.data.materials and obj.data.materials[0].name==material]
    if len(objects)<2: continue
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects: obj.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    bpy.ops.object.join()
    objects[0].name=character+'Kart_'+material
for track in rig.animation_data.nla_tracks: track.mute=False
bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True)
for obj in scene.objects:
    if obj.type=='MESH': obj.select_set(True)
path = os.path.join(OUT,character_id+'-kart-v2.glb')
bpy.ops.export_scene.gltf(filepath=path,export_format='GLB',use_selection=True,export_skins=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_yup=True,export_force_sampling=True,export_frame_step=2,export_materials='EXPORT')
report = {
    'version':2,'world':world,'character':character,'status':'Authored real 3D derivative; native full-world/contact verification pending',
    'source':'artwork/games/sound-racer/build_canonical_racers.py','baseVehicleAndContactRecipe':'artwork/games/sound-racer/build_racer.py',
    'baseRecipeSha256':hashlib.sha256(recipe.encode()).hexdigest(),
    'editable':'source-art/arcade/sound-racer-3d/'+character_id+'-kart-v2.blend',
    'runtime':'/game-assets/sound-racer/models/'+character_id+'-kart-v2.glb',
    'bytes':os.path.getsize(path),'sha256':hashlib.sha256(open(path,'rb').read()).hexdigest(),
    'clips':list(clip_frames),'semanticBones':list(bones),'axes':'Runtime +Y up, -Z forward; four tyres contact y=0',
    'identity':{'meadow':'Canonical yellow wool lamb, red scarf, cream face, floppy ears, exactly two silver coil legs and two attached brown feet','dino':'Canonical orange plush dinosaur, cream bandana and belly, sculpted snout, dorsal bumps, tail and two clawed feet','moonwood':'Canonical brown-haired green-eyed pointed-ear elf, short-sleeved woven green belted tunic and two brown boots'}[world],
    'geometry':'Original continuous integrated wool/face/ear/scarf mesh surfaces and real complete vehicle; no incorporated external mesh',
    'textureSource':'source-art/arcade/sound-racer-3d/'+{'meadow':'bouncy-wool','dino':'chompy-scale','moonwood':'pip-cloth'}[world]+'-albedo-v1.png',
    'ownership':'LiteracyPath original art + local Blender geometry; generated source and prompt retained'
}
open(os.path.join(SRC,character_id+'-kart-v2.json'),'w').write(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
