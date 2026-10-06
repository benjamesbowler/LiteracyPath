"""Author original sculpted space-route props, then registered RGBA views.

Source preparation. Execute only in a finite parent-scheduled art window.
There is no image-generation service, downloaded model or correctness input.
--no-render creates editable original models only; it proves no native pixels.
"""
import hashlib
import json
import math
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from rocket_route_spec import (ROUTE_ROLES, ROUTE_WORLDS, validate_route_spec,
    MEADOW_MATERIALS, MEADOW_GATE_CHANNEL, MEADOW_REFINED_ROLES,
    checked_role_camera, radial_sail_rotation, portal_frame_connections,
    checked_render_provenance, THEMED_ROUTE_MATERIALS, extended_support_path,
    fossil_portal_structure, fossil_station_structure, themed_lamp_support)  # noqa: E402


def argument(name, default=None):
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    return args[args.index(name) + 1] if name in args else default


def main():
    import bpy
    from mathutils import Vector
    from bpy_extras.object_utils import world_to_camera_view

    validate_route_spec()
    args = sys.argv[sys.argv.index("--") + 1:]
    root = Path(args[0]).resolve()
    world = argument("--world", "meadow")
    spec = ROUTE_WORLDS[world]
    size = int(argument("--size", "512"))
    if size not in (256, 384, 512):
        raise ValueError("Declare a finite original route view size")
    selected = tuple(argument("--roles", ",".join(ROUTE_ROLES)).split(","))
    if len(set(selected)) != len(selected) or any(role not in ROUTE_ROLES for role in selected):
        raise ValueError("Only distinct authored roles can enter a render batch")
    reference_path = argument('--camera-reference')
    reference = json.loads(Path(reference_path).read_text()) if reference_path else None
    retained_root = argument('--reuse-original-root')
    if retained_root and (not reference or world != 'meadow'
            or set(selected) not in (set(MEADOW_REFINED_ROLES), {'portal'})):
        raise ValueError('Retain only the original courier or the reviewed six-role bank in a portal-only repair')
    retained_root = Path(retained_root).resolve() if retained_root else None
    if reference:
        for role in selected:
            checked_role_camera(reference, world, role, size)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.preferences.filepaths.save_version = 0
    scene = bpy.context.scene
    materials = {}
    colours = {**spec, **(MEADOW_MATERIALS if world == 'meadow' else THEMED_ROUTE_MATERIALS[world])}
    wood = 'sandstone' if world == 'dino' else 'timber'
    brass = 'brass' if world == 'meadow' else 'copper'
    lamp = 'lampAmber' if world == 'meadow' else 'light'
    definitions = [
            ("hull", .38, .28, 0), ("panel", .66, .06, 0), ("accent", .43, .12, 0),
            ("light", .32, .10, .6), ("stone", .86, .05, 0), ("leaf", .64, 0, 0)]
    if world == 'meadow':
        definitions += [('timber', .73, 0, 0), ('brass', .34, .65, 0),
                        ('sailcloth', .88, 0, 0), ('lampAmber', .32, .05, .8)]
    elif world == 'dino':
        definitions += [('sandstone', .82, 0, 0), ('fossil', .68, 0, 0), ('copper', .34, .65, 0)]
    else:
        definitions += [('timber', .73, 0, 0), ('copper', .34, .65, 0)]
    for name, rough, metal, emission in definitions:
        mat = bpy.data.materials.new("OriginalRoute_" + name)
        mat.use_nodes = True
        mat.diffuse_color = (*colours[name], 1)
        node = mat.node_tree.nodes.get("Principled BSDF")
        node.inputs["Base Color"].default_value = (*colours[name], 1)
        node.inputs["Roughness"].default_value = rough
        node.inputs["Metallic"].default_value = metal
        if name in ("panel", "stone", "hull", 'timber', 'sailcloth', 'sandstone', 'fossil'):
            # Original procedural grain/patina is retained in the editable
            # material and its actual rendered pixels. It is not a fetched
            # stock texture or an unsupported unbaked glTF shader claim.
            nodes, links = mat.node_tree.nodes, mat.node_tree.links
            coordinates = nodes.new("ShaderNodeTexCoord")
            mapping = nodes.new("ShaderNodeVectorMath")
            mapping.operation = "MULTIPLY"
            mapping.inputs[1].default_value = ((3, 22, 4) if name in ('panel', 'timber') else
                (45, 45, 3) if name == 'sailcloth' else (16, 16, 16))
            links.new(coordinates.outputs["Generated"], mapping.inputs[0])
            noise = nodes.new("ShaderNodeTexNoise")
            noise.inputs["Scale"].default_value = 1
            noise.inputs["Detail"].default_value = 3 if name == "stone" else 2
            noise.inputs["Roughness"].default_value = .62
            links.new(mapping.outputs["Vector"], noise.inputs["Vector"])
            colour = nodes.new("ShaderNodeValToRGB")
            variation = .12 if name == "panel" else .11 if name == "stone" else .045
            colour.color_ramp.elements[0].position = .18
            colour.color_ramp.elements[0].color = (*[v*(1-variation) for v in colours[name]], 1)
            colour.color_ramp.elements[1].position = .80
            colour.color_ramp.elements[1].color = (*[min(1,v*(1+variation)) for v in colours[name]], 1)
            links.new(noise.outputs["Fac"], colour.inputs["Fac"])
            links.new(colour.outputs["Color"], node.inputs["Base Color"])
            bump = nodes.new("ShaderNodeBump")
            bump.inputs["Strength"].default_value = .12 if name == "stone" else .065
            bump.inputs["Distance"].default_value = .04
            links.new(noise.outputs["Fac"], bump.inputs["Height"])
            links.new(bump.outputs["Normal"], node.inputs["Normal"])
        if emission:
            node.inputs["Emission Color"].default_value = (*colours[name], 1)
            node.inputs["Emission Strength"].default_value = emission
        materials[name] = mat
    dark = bpy.data.materials.new("OriginalRoute_windowRecess")
    dark.diffuse_color = (.045, .065, .11, 1)
    dark.use_nodes = True
    dark.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = dark.diffuse_color
    materials["dark"] = dark
    roots = {}
    source_connections = []

    def finish(obj, role, name, material, smooth=True):
        obj.name = role + "_" + name
        obj.data.materials.append(materials[material])
        obj.parent = roots[role]
        for face in obj.data.polygons:
            face.use_smooth = smooth
        return obj

    def sphere(role, name, at, scale, mat, segments=24, rings=12):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=at)
        obj = bpy.context.object
        obj.scale = scale
        return finish(obj, role, name, mat)

    def box(role, name, at, scale, mat, bevel=.06, rotation=(0, 0, 0)):
        bpy.ops.mesh.primitive_cube_add(size=1, location=at, rotation=rotation)
        obj = bpy.context.object
        obj.scale = scale
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        if bevel:
            modifier = obj.modifiers.new("OriginalSoftEdges", "BEVEL")
            modifier.width = bevel
            modifier.segments = 3
            bpy.ops.object.modifier_apply(modifier=modifier.name)
        obj.modifiers.new("OriginalWeightedNormals", "WEIGHTED_NORMAL")
        return finish(obj, role, name, mat, False)

    def tube(role, name, points, radius, mat, sides=10):
        verts, faces = [], []
        for index, value in enumerate(points):
            point = Vector(value)
            tangent = Vector(points[min(index + 1, len(points)-1)]) - Vector(points[max(0, index-1)])
            tangent.normalize()
            u = tangent.cross(Vector((0, 0, 1)))
            if u.length < .01:
                u = tangent.cross(Vector((0, 1, 0)))
            u.normalize()
            v = tangent.cross(u)
            r = radius[index] if isinstance(radius, tuple) else radius
            for side in range(sides):
                angle = side * math.tau / sides
                verts.append(point + r * (u * math.cos(angle) + v * math.sin(angle)))
        for index in range(len(points)-1):
            for side in range(sides):
                a = index*sides+side
                b = index*sides+(side+1)%sides
                faces.append((a, b, b+sides, a+sides))
        faces += [tuple(reversed(range(sides))), tuple((len(points)-1)*sides+i for i in range(sides))]
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata(verts, [], faces)
        mesh.update()
        obj = bpy.data.objects.new(name, mesh)
        scene.collection.objects.link(obj)
        return finish(obj, role, name, mat)

    def ring(role, name, centre, radius, thickness, mat, start=0, end=math.tau, plane="xy"):
        steps = max(8, round((end-start)/math.tau*36))
        points = []
        for index in range(steps+1):
            angle = start + (end-start)*index/steps
            if plane == "xz":
                points.append((centre[0]+radius*math.cos(angle), centre[1], centre[2]+radius*math.sin(angle)))
            else:
                points.append((centre[0]+radius*math.cos(angle), centre[1]+radius*math.sin(angle), centre[2]))
        return tube(role, name, points, thickness, mat)

    def leaf(role, name, at, scale, angle, mat="leaf"):
        obj = sphere(role, name, at, scale, mat, 16, 8)
        obj.rotation_euler = (.18, -.12, angle)
        tube(role, name + "_vein", [(at[0], at[1]-.1, at[2]),
            (at[0]+math.cos(angle)*scale[0]*.6, at[1]-.1, at[2]+scale[2]*.3)], .025, "panel")
        return obj

    def lantern(role, at, scale=1):
        x, y, z = at
        sphere(role, "warmLens", at, (.19*scale, .19*scale, .30*scale), lamp)
        for dz in (-.31, .31):
            ring(role, "fittedLampBand", (x, y, z+dz*scale), .22*scale, .045*scale, brass)
        for n in range(4):
            a = n*math.pi/2
            tube(role, "lampCage", [(x+math.cos(a)*.22*scale, y+math.sin(a)*.22*scale, z-.30*scale),
                 (x+math.cos(a)*.22*scale, y+math.sin(a)*.22*scale, z+.30*scale)], .026*scale, "hull")
        if world != 'meadow':
            return sphere(role, 'solidCopperLampCap', (x, y, z+.305*scale),
                          (.23*scale, .23*scale, .06*scale), brass, 20, 10)
        return None

    def sail(role, name, at, width, height, angle):
        # A gently billowed fabric face and visible timber seam replace the
        # old solid pale box. Declared widths/heights and rotor locations stay
        # fixed; the long fabric axis now points out from the real rotor.
        corners = [(-width/2, 0, -height/2), (width/2, 0, -height/2),
                   (width*.46, 0, height/2), (-width*.46, 0, height/2)]
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata([*corners, (0, -.045, 0)], [], [(0, 1, 4), (1, 2, 4), (2, 3, 4), (3, 0, 4)])
        mesh.update()
        obj = bpy.data.objects.new(name, mesh)
        scene.collection.objects.link(obj)
        obj.location = at
        obj.rotation_euler = (0, angle, 0)
        finish(obj, role, name, 'sailcloth', False)
        points = [(at[0]+x*math.cos(angle)+z*math.sin(angle), at[1]-.012,
                   at[2]-x*math.sin(angle)+z*math.cos(angle)) for x, _, z in corners]
        tube(role, name+'_timberSeam', points+[points[0]], .014, wood)

    def pennant(role, name, at, width=.22, height=.28):
        x, y, z = at
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata([(x-width/2, y, z), (x+width/2, y, z),
                         (x+width*.08, y-.025, z-height)], [], [(0, 1, 2)])
        mesh.update()
        obj = bpy.data.objects.new(name, mesh)
        scene.collection.objects.link(obj)
        finish(obj, role, name, 'accent', False)

    for role in ROUTE_ROLES:
        empty = bpy.data.objects.new(role, None)
        scene.collection.objects.link(empty)
        roots[role] = empty

    # Three distinct stations share only the fitted deck/rail construction.
    role = "station"
    dock = sphere(role, "terracedDock", (0, 0, .12), (3.3, 2.5, .34), "hull")
    for z, radius in ((.36, 3.0), (.44, 2.6)):
        ring(role, "deckLip", (0, 0, z), radius, .075, brass)
    for index in range(18):
        a = index*math.tau/18
        x, y = math.cos(a)*2.9, math.sin(a)*2.1
        box(role, "deckPlank", (x*.45, y*.45, .40), (2.0, .14, .09), wood, .025, (0, 0, a))
        tube(role, "railPost", [(x, y, .45), (x, y, .96)], .045, wood)
        sphere(role, "brassRailBolt", (x, y, .97), (.08, .08, .08), "light", 12, 6)
    ring(role, "outerRail", (0, 0, .9), 2.9, .045, brass)
    sphere(role, "observatoryBody", (0, .1, 1.3), (1.32, 1.32, 1.15), "panel")
    for n in range(8):
        a = n*math.tau/8
        x, y = math.cos(a)*1.25, math.sin(a)*1.25
        sphere(role, "insetWindow", (x, y, 1.42), (.24, .16, .39), "dark")
        sphere(role, "windowGlow", (x*1.02, y*1.02, 1.42), (.18, .10, .31), "light")
    if world == "meadow":
        sphere(role, "blueDome", (0, .1, 2.20), (1.52, 1.52, .64), "hull")
        tube(role, "telescope", [(0, -.10, 2.45), (.48, -.95, 2.92)], (.27, .19), brass)
        sphere(role, "telescopeLens", (.48, -.95, 2.92), (.24, .10, .24), "light")
        for n in range(4):
            a = n*math.pi/2+.2
            sail(role, 'goldSail', (math.cos(a)*1.05, -1.46, 2.3+math.sin(a)*1.05), .44, 1.48, radial_sail_rotation(a))
        sphere(role, 'fittedRotorHub', (0, -1.53, 2.3), (.18, .10, .18), brass, 20, 10)
        tube(role, 'buntingRope', [(-1.8, -2.0, .97), (0, -2.04, .90), (1.65, -2.0, .97)], .018, wood)
        for n in range(6):
            pennant(role, 'redBunting', (-1.7+n*.65, -2.04, .90))
    elif world == "dino":
        sphere(role, "amberTerraceRoof", (0, .1, 2.24), (1.54, 1.4, .45), "hull")
        structure = fossil_station_structure()
        roof_rib = tube(role, 'continuousFossilRoofRib', extended_support_path(structure['rib']),
                        structure['ribRadius'], 'fossil')
        for side, endpoint in ((1, structure['rib'][0]), (-1, structure['rib'][-1])):
            footing = box(role, 'fittedStoneRibFooting', (side*1.82, .22, structure['footingZ']),
                          structure['footingSize'], 'sandstone', .045)
            source_connections.append({'role': role, 'name': 'roof-rib-to-stone-footing',
                                       'point': endpoint, 'objects': (roof_rib, footing)})
            source_connections.append({'role': role, 'name': 'stone-footing-to-dock',
                                       'point': (side*1.82, .22, .39), 'objects': (footing, dock)})
        for n in range(9):
            a = n*math.pi/8
            point = (math.cos(a)*1.82, .22, 1.3+math.sin(a)*2.12)
            bone = sphere(role, "fittedSpineArch", point, (.24, .30, .34), "fossil", 16, 8)
            source_connections.append({'role': role, 'name': 'roof-vertebra-to-continuous-rib',
                                       'point': point, 'objects': (bone, roof_rib)})
        for side in (-1, 1):
            for n in range(4):
                leaf(role, "fernFan", (side*(1.1+n*.17), -.2, 2.5+n*.10), (.38, .15, .11), side*(.3+n*.25))
    else:
        for n in range(10):
            a = n*math.tau/10
            leaf(role, "layeredLeafRoof", (math.cos(a)*.92, math.sin(a)*.92, 2.26),
                 (.90, .35, .16), a, "hull")
        for side in (-1, 1):
            bracket = tube(role, "curledBranchBracket", [(side*1.0, 0, .5), (side*1.6, 0, 1.4),
                 (side*1.8, 0, 2.6), (side*1.25, 0, 3.0)], (.13, .11, .08, .04), wood)
            cap = lantern(role, (side*1.25, 0, 2.45), .7)
            points = [(side*1.25, 0, 2.985), (side*1.25, 0, 2.45+.33*.7)]
            hanger = tube(role, 'portLampHanger', extended_support_path(points, .025), .025, brass)
            source_connections += [
                {'role': role, 'name': 'port-hanger-to-branch', 'point': points[0], 'objects': (bracket, hanger)},
                {'role': role, 'name': 'port-hanger-to-lamp', 'point': points[-1], 'objects': (hanger, cap)}]

    # The central gap is a real open silhouette, with no panel across lanes.
    role = "portal"
    portal_supports = []
    fossil_structure = fossil_portal_structure() if world == 'dino' else None
    fossil_columns = {}
    pylon_x = 5.6  # Clears all three lanes and the widest authored craft wings.
    for side in (-1, 1):
        base = box(role, "fittedPylonBase", (side*pylon_x, 0, .1), (1.15, 1.05, .42), "hull")
        if world == "meadow":
            post = box(role, "timberPylon", (side*pylon_x, 0, 2.0), (.44, .52, 3.75), wood)
            joints = portal_frame_connections(side)
            riser = box(role, 'connectedPostRiser', joints['riserCentre'], joints['riserSize'], wood)
            for z in (.7, 1.5, 2.3, 3.2):
                box(role, "rivetedBinding", (side*pylon_x, -.29, z), (.58, .11, .11), brass, .025)
                for dx in (-.17, .17):
                    sphere(role, 'bindingBolt', (side*pylon_x+dx, -.37, z), (.035, .027, .035), 'hull', 12, 6)
            for n in range(4):
                a = n*math.pi/2+.2
                sail(role, 'harbourSail', (side*pylon_x+math.cos(a)*.7, -.5, 3.3+math.sin(a)*.7), .25, 1.0, radial_sail_rotation(a))
            sphere(role, 'windmillRotorHub', (side*pylon_x, -.59, 3.3), (.13, .09, .13), brass, 20, 10)
            tube(role, 'outboardTimberBrace', [(side*pylon_x, .13, .45),
                (side*6.0, .13, 1.55), (side*pylon_x, .13, 2.25)], .06, wood)
            knee = tube(role, 'joinedArchKneeBrace', joints['kneeEndpoints'], joints['kneeRadius'], wood)
            portal_supports.append({'side': side, 'post': post, 'riser': riser,
                                    'knee': knee, 'endpoints': joints['kneeEndpoints']})
            ring(role, 'plantedBaseLip', (side*5.97, -.09, .30), .20, .035, brass)
            sphere(role, 'plantedBasePot', (side*5.97, -.09, .18), (.21, .20, .16), wood, 20, 10)
            for n in range(3):
                leaf(role, 'gateLeaf', (side*(5.97+.06*(n-1)), -.10, .42+n*.06),
                    (.20, .085, .055), side*(.3+n*.4))
            for dx, dz in ((-.09, .55), (.07, .58)):
                sphere(role, 'gateFlower', (side*(5.97+dx), -.16, dz), (.07, .045, .07), 'accent', 12, 6)
        elif world == "dino":
            centres = fossil_structure['columns'][side]
            column = tube(role, 'continuousFossilColumn', extended_support_path(centres),
                          fossil_structure['columnRadius'], 'fossil')
            fossil_columns[side] = column
            source_connections.append({'role': role, 'name': 'fossil-column-to-pylon-base',
                                       'point': centres[0], 'objects': (column, base)})
            for n, at in enumerate(centres):
                bone = sphere(role, "vertebraColumn", at, (.34, .38, .28), "fossil", 16, 8)
                source_connections.append({'role': role, 'name': 'column-vertebra-to-continuous-rib',
                                           'point': at, 'objects': (bone, column)})
                if n in (1, 3, 5):
                    ring(role, 'fittedCopperVertebraBinding', at, .34, .026, brass)
        else:
            column = tube(role, "carvedTreeArch", [(side*pylon_x, 0, .2), (side*5.5, 0, 1.7),
                 (side*5.3, 0, 3.4), (side*5.05, 0, 4.0)], (.30, .24, .17, .08), wood)
            for n in range(4):
                leaf(role, "leafGarland", (side*(5.3-.16*n), 0, 3.2+n*.19), (.43, .2, .13), side*.6)
            for z, x in ((.8, 5.58), (1.8, 5.48), (2.75, 5.37)):
                ring(role, "fittedCopperTreeBand", (side*x, 0, z), .26, .045, brass)
        cap = lantern(role, (side*4.9, -.12, 2.8), .8)
        if world == 'meadow':
            tube(role, 'realLanternHanger', [(side*4.9, -.12, 3.35),
                (side*4.9, -.12, 3.07)], .025, brass)
        else:
            points = themed_lamp_support(world, side)
            hanger = tube(role, 'attachedThemedLanternBracket', extended_support_path(points, .04), .032, brass)
            parent = fossil_columns[side] if world == 'dino' else column
            source_connections += [
                {'role': role, 'name': 'gate-lamp-to-actual-support', 'point': points[0], 'objects': (parent, hanger)},
                {'role': role, 'name': 'gate-hanger-to-solid-cap', 'point': points[-1], 'objects': (hanger, cap)}]
    if world == 'dino':
        path, spans = fossil_structure['overhead'], []
        for index, (a, b) in enumerate(zip(path, path[1:])):
            spans.append(tube(role, 'connectedFossilOverheadRib', extended_support_path([a, b]),
                              fossil_structure['overheadRadius'], 'fossil'))
            length = (Vector(b)-Vector(a)).length
            steps = max(1, math.ceil(length/.38))
            for n in range(steps):
                centre = Vector(a).lerp(Vector(b), n/steps)
                bone = sphere(role, 'fittedArchVertebra', centre, fossil_structure['segmentScale'], 'fossil', 16, 8)
                source_connections.append({'role': role, 'name': 'arch-vertebra-to-continuous-rib',
                                           'point': tuple(centre), 'objects': (bone, spans[-1])})
        bone = sphere(role, 'fittedArchVertebra', path[-1], fossil_structure['segmentScale'], 'fossil', 16, 8)
        source_connections.append({'role': role, 'name': 'arch-vertebra-to-continuous-rib',
                                   'point': path[-1], 'objects': (bone, spans[-1])})
        for index in range(len(spans)-1):
            source_connections.append({'role': role, 'name': 'continuous-overhead-fossil-joint',
                'point': path[index+1], 'objects': (spans[index], spans[index+1])})
        for side, span, point in ((-1, spans[0], path[0]), (1, spans[-1], path[-1])):
            source_connections.append({'role': role, 'name': 'overhead-rib-to-column',
                'point': point, 'objects': (span, fossil_columns[side])})
    if world == "meadow":
        # Above the flying/word channel; its silhouette leaves the middle
        # genuinely empty rather than disguising a solid panel as a gate.
        portal_arch = box(role, "highTimberRouteArch", (0, 0, 4.65), (11.4, .32, .26), wood, .045)
        box(role, 'fittedBrassArchLip', (0, -.19, 4.69), (11.15, .055, .055), brass, .015)
        for x in (-5.3, -4.2, 4.2, 5.3):
            sphere(role, "archRivet", (x, -.23, 4.65), (.08, .05, .08), brass, 12, 6)
        # Decoration stays above the open flight channel, never across its
        # reading faces or widest real ship silhouette.
        tube(role, 'highPennantRope', [(-4.1, -.20, 4.55), (0, -.24, 4.28),
            (4.1, -.20, 4.55)], .018, wood)
        for n in range(9):
            x = -3.6+n*.9
            z = 4.30+.20*(abs(x)/3.6)
            pennant(role, 'stitchedGatePennant', (x, -.26, z), .23, .25)

    role = "courier"
    sphere(role, "blankCargoBody", (0, 0, 0), (.42, .28, .23), "panel")
    for x in (-.23, 0, .23):
        ring(role, "fittedCargoRib", (x, 0, 0), .285, .035, "hull", plane="xz")
    for side in (-1, 1):
        sphere(role, "enginePod", (side*.50, 0, -.02), (.13, .22, .13), "hull")
        sphere(role, "nozzle", (side*.50, .19, -.02), (.07, .05, .07), "light")
        box(role, "goldClasp", (side*.31, -.24, .07), (.095, .06, .13), "accent", .02)
        if world == "moonwood":
            leaf(role, "leafWing", (side*.47, .03, .10), (.20, .10, .065), side*.6)
        elif world == "dino":
            sphere(role, "fossilFitting", (side*.25, -.2, .19), (.075, .075, .07), "light", 12, 6)
        else:
            tube(role, "pennantRod", [(side*.33, .05, .12), (side*.33, .05, .38)], .016, "panel")
            box(role, "redPennant", (side*.39, .05, .31), (.12, .025, .11), "accent", .01)

    role = "planet"
    sphere(role, "sculptedMoon", (0, 0, 0), (2.8, 2.8, 2.65), "hull", 40, 24)
    for n in range(9):
        a = n*2.399963
        z = -1.0+(n%4)*.75
        r = math.sqrt(max(.1, 2.7**2-z*z))
        centre = Vector((math.cos(a)*r, math.sin(a)*r, z))
        normal = centre.normalized()
        island = sphere(role, "raisedIsland", centre,
                        (.65, .52, .18), "leaf" if world != "dino" else "panel", 20, 10)
        island.rotation_mode = 'QUATERNION'
        island.rotation_quaternion = normal.to_track_quat('Z', 'Y')
        if world == "meadow":
            tangent = normal.cross(Vector((0, 0, 1)))
            if tangent.length < .01:
                tangent = normal.cross(Vector((0, 1, 0)))
            tangent.normalize()
            other = normal.cross(tangent)
            bloom = centre+normal*.18
            for k in range(5):
                angle = k*math.tau/5
                petal = bloom + .13*(tangent*math.cos(angle)+other*math.sin(angle))
                sphere(role, "flowerIslandPetal", petal, (.095, .095, .095), "accent", 12, 6)
            sphere(role, "flowerIslandCentre", bloom+normal*.035, (.075, .075, .075), "light", 12, 6)
    for n in range(3):
        a = n*2.1
        x, y = math.cos(a)*1.4, math.sin(a)*1.4
        if world == "meadow":
            box(role, "miniWindmill", (x, y, 2.35), (.16, .16, .42), wood, .025)
            for k in range(4):
                sail(role, 'tinySail', (x+math.cos(k*math.pi/2)*.18, y-.1, 2.55+math.sin(k*math.pi/2)*.18),
                    .07, .26, radial_sail_rotation(k*math.pi/2))
        elif world == "dino":
            ring(role, "miniFossilRib", (x, y, 2.30), .34, .075, "panel", 0, math.pi, "xz")
        else:
            tube(role, "miniLanternTree", [(x, y, 2.1), (x, y, 2.7), (x+.3, y, 2.9)], (.07, .04, .02), "panel")
            lantern(role, (x+.3, y, 2.62), .35)
            tube(role, "miniMushroomStem", [(x-.25, y-.2, 2.12), (x-.25, y-.2, 2.45)], .07, "panel")
            sphere(role, "miniMushroomCap", (x-.25, y-.2, 2.48), (.28, .28, .12), "accent", 16, 8)
            for k in range(3):
                angle = k*math.tau/3
                sphere(role, "mushroomCapSpot", (x-.25+.13*math.cos(angle), y-.2+.13*math.sin(angle), 2.57),
                       (.047, .047, .018), "light", 12, 6)
    if world == "dino":
        sphere(role, "miniCopperObservatory", (.15, -1.0, 2.40), (.42, .42, .36), "hull", 20, 10)
        ring(role, "miniDomeBase", (.15, -1.0, 2.20), .45, .045, "panel")

    role = "asteroid"
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=.6)
    rock = bpy.context.object
    for vertex in rock.data.vertices:
        q = vertex.co
        q *= 1 + .08*math.sin(q.x*19+q.y*13)*math.cos(q.z*17)
    finish(rock, role, "facetedOriginalRock", "stone")
    for n, (x, z, radius) in enumerate(((-.24, .15, .18), (.20, .29, .13), (.12, -.22, .10))):
        sphere(role, "insetCrater", (x, -.52, z), (radius, .055, radius), "dark", 16, 8)
        ring(role, "layeredCraterRim", (x, -.57, z), radius, .028, brass, plane="xz")
    for n in range(3):
        bpy.ops.mesh.primitive_cone_add(vertices=5, radius1=.065, radius2=.015, depth=.25,
            location=(-.25+n*.14, .05, .51+n*.015))
        finish(bpy.context.object, role, "mineralCrystal", "light", False)

    role = "beacon"
    sphere(role, "circularGearBase", (0, 0, 0), (.58, .58, .15), "hull")
    for n in range(12):
        a = n*math.tau/12
        box(role, "fittedGearTooth", (math.cos(a)*.54, math.sin(a)*.54, 0), (.13, .13, .17), brass, .025, (0, 0, a))
    tube(role, "carvedBeaconArm", [(0, 0, .08), (0, 0, 1.0), (.42, 0, 1.37), (.67, 0, 1.28)], (.09, .075, .06, .035), wood)
    lantern(role, (.64, 0, .88), 1)
    if world != "meadow":
        for side in (-1, 1):
            leaf(role, "beaconLeaf", (side*.22, 0, .7), (.30, .13, .085), side*.6)

    role = "comet"
    sphere(role, "mineralCometHead", (0, 0, 0), (.80, .72, .72), brass)
    for n in range(5):
        offset = (n-2)*.16
        tube(role, "taperedRibbon", [(offset, .4, .10*math.sin(n)),
            (offset*1.2, 1.4, .25+offset), (offset*.6+.30, 3.2, .15-offset),
            (offset*.3+.50, 5.0, .35)], (.14, .12, .07, .005), "light" if n%2 else "hull")
    for n in range(3):
        sphere(role, "headCrater", ((n-1)*.3, -.64, .10), (.11, .055, .13), "hull", 16, 8)

    portal_channel = None
    portal_connections = []
    actual_source_connections = []
    if world != 'meadow':
        # Connection samples refer to actual original solids, not their
        # bounding boxes. A shared joint centre must lie inside both meshes.
        from mathutils.bvhtree import BVHTree
        bpy.context.view_layer.update()
        graph = bpy.context.evaluated_depsgraph_get()
        solid_trees = {}
        def connection_margin(obj, point):
            if obj.name not in solid_trees:
                evaluated = obj.evaluated_get(graph)
                mesh = evaluated.to_mesh()
                try:
                    mesh.calc_loop_triangles()
                    vertices = [evaluated.matrix_world @ vertex.co for vertex in mesh.vertices]
                    triangles = [tuple(triangle.vertices) for triangle in mesh.loop_triangles]
                    solid_trees[obj.name] = BVHTree.FromPolygons(vertices, triangles, all_triangles=True)
                finally:
                    evaluated.to_mesh_clear()
            location, normal, _, distance = solid_trees[obj.name].find_nearest(Vector(point))
            signed = (Vector(point)-location).dot(normal) if location is not None else float('inf')
            if distance is None or distance <= 1e-6 or signed >= -1e-6:
                raise ValueError('An actual themed prop joint is outside its solid: '+obj.name)
            return {'object': obj.name, 'surfaceDistance': distance, 'signedSurfaceDistance': signed}
        for connection in source_connections:
            actual_source_connections.append({'role': connection['role'], 'connection': connection['name'],
                'actualSharedPoint': list(connection['point']),
                'actualSolidMargins': [connection_margin(obj, connection['point']) for obj in connection['objects']]})
    if world in ROUTE_WORLDS:
        # Evaluate real constructed surfaces, including bevels. A decorative
        # span may not enter the declared clear flight/reading channel.
        bpy.context.view_layer.update()
        graph = bpy.context.evaluated_depsgraph_get()
        def actual_bounds(obj):
            evaluated = obj.evaluated_get(graph)
            mesh = evaluated.to_mesh()
            try:
                points = [evaluated.matrix_world @ vertex.co for vertex in mesh.vertices]
            finally:
                evaluated.to_mesh_clear()
            return ([min(point[index] for point in points) for index in range(3)],
                    [max(point[index] for point in points) for index in range(3)])

        arch_bounds = actual_bounds(portal_arch) if world == 'meadow' else None
        for support in portal_supports:
            post_bounds, riser_bounds = actual_bounds(support['post']), actual_bounds(support['riser'])
            for name, other in (('riser-to-post', post_bounds), ('riser-to-arch', arch_bounds)):
                overlap = [min(riser_bounds[1][index], other[1][index])
                           - max(riser_bounds[0][index], other[0][index]) for index in range(3)]
                if not all(value > 0 for value in overlap):
                    raise ValueError('A real timber support is disconnected: '+name)
                portal_connections.append({'side': support['side'], 'connection': name,
                    'actualOverlap': overlap, 'supportObject': support['riser'].name})
            for name, point, target in zip(('knee-to-post', 'knee-to-arch'), support['endpoints'],
                                         (post_bounds, arch_bounds)):
                if not all(target[0][index] < point[index] < target[1][index] for index in range(3)):
                    raise ValueError('An actual knee endpoint is outside its timber support: '+name)
                portal_connections.append({'side': support['side'], 'connection': name,
                    'actualEndpoint': list(point), 'actualSupportBounds': target,
                    'supportObject': support['knee'].name})
        tested = 0
        nearest = float('inf')
        for obj in scene.objects:
            if obj.type != 'MESH' or obj.parent is not roots['portal']:
                continue
            evaluated = obj.evaluated_get(graph)
            mesh = evaluated.to_mesh()
            try:
                points = [evaluated.matrix_world @ vertex.co for vertex in mesh.vertices]
            finally:
                evaluated.to_mesh_clear()
            lo_x, hi_x = min(p.x for p in points), max(p.x for p in points)
            lo_z, hi_z = min(p.z for p in points), max(p.z for p in points)
            tested += 1
            if lo_z < MEADOW_GATE_CHANNEL['top'] and hi_z > MEADOW_GATE_CHANNEL['bottom']:
                if lo_x < MEADOW_GATE_CHANNEL['halfWidth'] and hi_x > -MEADOW_GATE_CHANNEL['halfWidth']:
                    raise ValueError('An actual gate surface blocks the clear channel: '+obj.name)
                nearest = min(nearest, abs(lo_x) if lo_x >= 0 else abs(hi_x))
        portal_channel = {**MEADOW_GATE_CHANNEL, 'actualEvaluatedMeshes': tested,
                          'nearestSideSurface': nearest, 'sourceOnly': True,
                          'motorCollisionChanged': False}

    source_dir = root / 'source-art/arcade/rocket-run/route-kit-v1' / world
    source_dir.mkdir(parents=True, exist_ok=True)
    source = source_dir / 'original-route-kit.blend'
    bpy.ops.wm.save_as_mainfile(filepath=str(source))
    if '--no-render' in args:
        print(json.dumps({'status': 'AUTHORED source only; no native/render acceptance', 'world': world,
                          'source': str(source), 'objects': len(scene.objects), 'roles': ROUTE_ROLES}))
        return

    def measured_motor_core(role):
        if role not in ('courier', 'asteroid'):
            return None
        core_name = role + ('_blankCargoBody' if role == 'courier' else '_facetedOriginalRock')
        core = bpy.data.objects[core_name]
        # Evaluate real vertices; decoration cannot enlarge the motor rule.
        graph = bpy.context.evaluated_depsgraph_get()
        evaluated = core.evaluated_get(graph)
        mesh = evaluated.to_mesh()
        try:
            radius = max((evaluated.matrix_world @ vertex.co).length for vertex in mesh.vertices)
        finally:
            evaluated.to_mesh_clear()
        return {'sourcePoint': [0, 0, 0], 'radius': radius,
                'measurement': 'Maximum actual evaluated core-vertex distance from original origin',
                'sourceObject': core_name,
                'excluded': 'Decorative thrusters, pennants, mineral crystals and crater fittings'}

    current_source = {'path': str(source.relative_to(root)),
                      'sha256': hashlib.sha256(source.read_bytes()).hexdigest()}
    render_sources = [current_source]
    records = []
    if retained_root:
        original_registration = retained_root / 'source-art/arcade/rocket-run/route-kit-v1/meadow/registration.json'
        retained_record = json.loads(original_registration.read_text())
        checked_render_provenance(retained_record)
        retained_registration_sha = hashlib.sha256(original_registration.read_bytes()).hexdigest()
        # Every retained role owns the actual Blend that rendered its pixels.
        # The portal-only retry keeps the reviewed five and original courier;
        # neither can silently acquire the new portal Blend as its source.
        for role in ROUTE_ROLES:
            if role in selected:
                continue
            original = checked_role_camera(retained_record, world, role, size)
            fixed = checked_role_camera(reference, world, role, size)
            if any(original[key] != fixed[key] for key in ('camera', 'anchor', 'pixelsPerUnit', 'size', 'motorCore')):
                raise ValueError('Retained pixels changed original projection/core: '+role)
            if measured_motor_core(role) != original['motorCore']:
                raise ValueError('An actual retained motor core changed: '+role)
            old_source_record = original.get('renderSource') or {
                'path': retained_record['source'], 'sha256': retained_record['sourceSha256']}
            old_source = retained_root/old_source_record['path']
            if hashlib.sha256(old_source.read_bytes()).hexdigest() != old_source_record['sha256']:
                raise ValueError('A retained role authoring source changed: '+role)
            old_png = retained_root/original['source']
            if hashlib.sha256(old_png.read_bytes()).hexdigest() != original['sha256']:
                raise ValueError('Retained role pixels changed: '+role)
            retained_source = source_dir/('retained-role-source-'+old_source_record['sha256'][:16]+'.blend')
            if not retained_source.exists():
                shutil.copyfile(old_source, retained_source)
            shutil.copyfile(old_png, root/original['source'])
            original['renderSource'] = {'path': str(retained_source.relative_to(root)),
                                        'sha256': old_source_record['sha256']}
            original['renderMode'] = 'retained-original-pixels'
            original['retention'] = {**(original.get('retention') or {}),
                'previousRegistrationSha256': retained_registration_sha,
                'originalRegistrationSha256': (original.get('retention') or {}).get('originalRegistrationSha256') or retained_registration_sha,
                'meaning': 'Unchanged actual role pixels and original projection/core; not rerendered from the current source'}
            records.append(original)
            if original['renderSource'] not in render_sources:
                render_sources.append(original['renderSource'])

    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 16
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.resolution_x = scene.render.resolution_y = size
    scene.render.resolution_percentage = 100
    for at, power, area in (((3, -4, 7), 800, 5), ((-4, 2, 5), 500, 4)):
        bpy.ops.object.light_add(type='AREA', location=at)
        bpy.context.object.data.energy = power
        bpy.context.object.data.size = area
    bpy.ops.object.camera_add(location=(3.2, -6, 3.3))
    camera = bpy.context.object
    camera.data.type = 'ORTHO'
    scene.camera = camera
    for role in selected:
        for obj in scene.objects:
            if obj.type == 'MESH':
                obj.hide_render = obj.parent is not roots[role]
        meshes = [obj for obj in scene.objects if obj.type == 'MESH' and not obj.hide_render]
        bpy.context.view_layer.update()
        points = [obj.matrix_world @ Vector(corner) for obj in meshes for corner in obj.bound_box]
        fixed = checked_role_camera(reference, world, role, size) if reference else None
        focus = Vector(fixed['camera']['focus']) if fixed else sum(points, Vector()) / len(points)
        camera.location = fixed['camera']['location'] if fixed else focus + Vector((3.2, -6, 3.3))
        camera.rotation_euler = (focus-camera.location).to_track_quat('-Z', 'Y').to_euler()
        camera.data.ortho_scale = fixed['camera']['orthoScale'] if fixed else 1
        bpy.context.view_layer.update()
        if not fixed:
            maximum = max(max(2*abs(p.x-.5), 2*abs(p.y-.5))
                for p in (world_to_camera_view(scene, camera, point) for point in points))
            camera.data.ortho_scale = maximum * 1.18
        ppu = size / camera.data.ortho_scale
        projected = world_to_camera_view(scene, camera, Vector((0, 0, 0)))
        anchor = [projected.x*size, (1-projected.y)*size]
        if fixed and (anchor != fixed['anchor'] or ppu != fixed['pixelsPerUnit']):
            raise ValueError('The actual original physical origin/projection changed: '+role)
        scene.render.filepath = str(source_dir / (role+'.png'))
        scene.cycles.seed = ROUTE_ROLES.index(role)*17
        bpy.ops.render.render(write_still=True)
        path = source_dir / (role+'.png')
        motor_core = measured_motor_core(role)
        if fixed and motor_core != fixed['motorCore']:
            raise ValueError('The actual original evaluated motor core changed: '+role)
        records.append({'role': role, 'source': str(path.relative_to(root)),
                        'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                        'renderSource': current_source, 'renderMode': 'rendered-from-refined-source' if fixed else 'rendered-original-source',
                        'description': spec[role], 'size': [size, size], 'anchor': anchor,
                        'pixelsPerUnit': ppu, 'motorCore': motor_core,
                        'camera': {'orthoScale': camera.data.ortho_scale,
                            'location': list(camera.location), 'focus': list(focus)}})
        print(json.dumps({'renderedRole': role, 'world': world}), flush=True)
    records.sort(key=lambda row: ROUTE_ROLES.index(row['role']))
    manifest = {'game': 'rocket-run', 'world': world, 'creator': 'LiteracyGuide original sculpted space route',
                'source': str(source.relative_to(root)), 'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
                'roles': records, 'trueAlpha': True, 'nativeReview': 'UNKNOWN', 'humanReview': 'UNKNOWN',
                'completeRoleBank': len(records) == len(ROUTE_ROLES),
                'renderSources': render_sources, 'renderedRoles': list(selected),
                'retainedRoles': [role for role in ROUTE_ROLES if role not in selected] if retained_root else [],
                'portalChannel': portal_channel,
                'portalConnections': portal_connections,
                'themedSourceConnections': actual_source_connections,
                'cameraReference': None if not reference_path else {
                    'path': str(Path(reference_path).resolve().relative_to(Path(__file__).resolve().parents[3])),
                    'sha256': hashlib.sha256(Path(reference_path).read_bytes()).hexdigest(),
                    'meaning': 'Same actual original origin, canvas, pixel anchor and projection scale'},
                'status': 'Rendered original source only; encoding/geometry/native review OPEN'}
    (source_dir/'registration.json').write_text(json.dumps(manifest, indent=2)+'\n')
    print(json.dumps({'world': world, 'renderedRoles': len(selected),
                      'retainedRoles': len(manifest['retainedRoles']), 'complete': manifest['completeRoleBank']}))


if __name__ == '__main__':
    main()
