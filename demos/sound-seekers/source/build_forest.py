"""Build the original Sound Seekers woodland kit in Blender 5.2.

Run: blender --background --python build_forest.py -- [--preview /tmp/forest.png]
The authored meshes use curved profiles, continuous curved limbs, irregular
canopy surfaces, and per-vertex pigment. No external model, texture, or service
is required. The gallery .blend is editable; each export is reset to its own
ground origin and glTF's Y-up / +Z-forward coordinate convention.
"""

import argparse
import json
import math
from pathlib import Path
import sys

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "forest"
SOURCE = ROOT / "source"
TAU = math.tau
ASSETS = []


def pigment_field(point):
    # Explicit smooth field keeps geometry reproducible across Blender launches.
    return (.4 * math.sin(point.x * 1.73 + math.sin(point.z * 2.43))
        + .35 * math.sin(point.y * 2.31 + point.x * .6)
        + .25 * math.cos(point.z * 3.14 - point.y * .4))


def rgba(hex_code):
    s = hex_code.lstrip("#")
    vals = [int(s[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in vals) + (1.,)


P = {k: rgba(v) for k, v in {
    "bark": "865538", "bark_light": "AD7950", "bark_dark": "603C2C",
    "fern": "467E53", "leaf": "6DA768", "leaf_light": "8BB879",
    "leaf_dark": "407653", "sage": "759F7A", "sage_light": "9DBB8C",
    "moss": "738D43", "moss_light": "96AC58", "stucco": "EDD5A3",
    "stucco_shade": "CCB180", "coral": "D87559", "roof_light": "E98A66",
    "cream": "FFE2A7", "gill": "CF9C7B", "door": "91A070",
    "door_dark": "45594C", "brass": "CFA455", "stone": "99A995",
    "stone_light": "C2C9AD", "lichen": "D5CC8D", "berry": "CE7957",
}.items()}


def material(name, emission=False):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Roughness"].default_value = .83
    attr = mat.node_tree.nodes.new("ShaderNodeVertexColor")
    attr.layer_name = "Pigment"
    mat.node_tree.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    if emission:
        mat.node_tree.links.new(attr.outputs["Color"], bsdf.inputs["Emission Color"])
        bsdf.inputs["Emission Strength"].default_value = 1.3
        bsdf.inputs["Roughness"].default_value = .35
    return mat


def colorize(obj, color, mat=None, variation=.12):
    if isinstance(color, str):
        color = P[color]
    obj.data.materials.clear()
    obj.data.materials.append(mat or PAINT)
    attr = obj.data.color_attributes.get("Pigment") or obj.data.color_attributes.new(
        name="Pigment", type="BYTE_COLOR", domain="CORNER")
    values = []
    for v in obj.data.vertices:
        q = obj.matrix_world @ v.co
        n = pigment_field(q * 1.3)
        fine = pigment_field(q * 9.3)
        gain = 1 + variation * n + .022 * fine
        values.append(tuple(max(0., min(1., color[c] * gain)) for c in range(3)) + (1.,))
    for loop in obj.data.loops:
        attr.data[loop.index].color = values[loop.vertex_index]
    for face in obj.data.polygons:
        face.use_smooth = True
    return obj


def mesh(name, verts, faces, color, mat=None):
    data = bpy.data.meshes.new(name)
    data.from_pydata(verts, [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    colorize(obj, color, mat)
    return obj


def surface(name, center, scale, color, seed=0, seg=32, rings=20, wrinkle=.07):
    """Irregular oval sculpt surface; broad fluting and smaller pigment grain."""
    verts, faces = [], []
    for i in range(rings + 1):
        theta = math.pi * i / rings
        for j in range(seg):
            phi = TAU * j / seg
            unit = Vector((math.sin(theta) * math.cos(phi), math.sin(theta) * math.sin(phi), math.cos(theta)))
            ripple = math.sin(phi * 5 + seed * .9 + theta * 3) * math.sin(theta) ** 2
            grain = pigment_field(unit * 3.2 + Vector((seed, seed * .7, 0)))
            r = 1 + wrinkle * (.52 * ripple + .7 * grain)
            verts.append(tuple(center[k] + unit[k] * scale[k] * r for k in range(3)))
    for i in range(rings):
        for j in range(seg):
            a = i * seg + j
            b = i * seg + (j + 1) % seg
            faces.append((a, a + seg, b + seg, b))
    return mesh(name, verts, faces, color)


def catmull(points, steps=6):
    ps = [Vector(p) for p in points]
    ext = [ps[0]] + ps + [ps[-1]]
    result = []
    for i in range(1, len(ext) - 2):
        p0, p1, p2, p3 = ext[i - 1:i + 3]
        for j in range(steps):
            t = j / steps
            result.append(.5 * ((2 * p1) + (-p0 + p2) * t +
                (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
                (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    return result + [ps[-1]]


def limb(name, points, radii, color, seg=16, steps=5, flute=.07):
    """Parallel-transport curved, tapering limb with non-circular bark flutes."""
    ps = catmull(points, steps)
    rs = catmull([(r, 0, 0) for r in radii], steps)
    verts, faces = [], []
    previous_side = Vector((1., 0., 0.))
    for i, p in enumerate(ps):
        tangent = (ps[min(i + 1, len(ps) - 1)] - ps[max(0, i - 1)]).normalized()
        side = previous_side - tangent * previous_side.dot(tangent)
        if side.length < .01:
            side = tangent.cross(Vector((0, 1, 0)))
        side.normalize()
        up = tangent.cross(side).normalized()
        previous_side = side
        for j in range(seg):
            a = j * TAU / seg
            r = max(.006, rs[i].x) * (1 + flute * math.sin(a * 5 + i * .12))
            q = p + r * (math.cos(a) * side + math.sin(a) * up)
            verts.append(tuple(q))
    for i in range(len(ps) - 1):
        for j in range(seg):
            a = i * seg + j
            b = i * seg + (j + 1) % seg
            faces.append((a, b, b + seg, a + seg))
    faces.extend([tuple(reversed(range(seg))), tuple((len(ps) - 1) * seg + j for j in range(seg))])
    return mesh(name, verts, faces, color)


def lathe(name, profile, center, color, seg=56, uneven=.018, phase=0):
    verts, faces = [], []
    for i, (radius, z) in enumerate(profile):
        for j in range(seg):
            a = j * TAU / seg
            wobble = 1 + uneven * math.sin(a * 5 + phase) + uneven * .4 * math.sin(a * 9 - z)
            verts.append((center[0] + radius * math.cos(a) * wobble,
                center[1] + radius * math.sin(a) * wobble,
                center[2] + z + uneven * .5 * radius * math.sin(a * 3 + phase)))
    for i in range(len(profile) - 1):
        for j in range(seg):
            a, b = i * seg + j, i * seg + (j + 1) % seg
            faces.append((a, b, b + seg, a + seg))
    return mesh(name, verts, faces, color)


def ring(name, center, radius, thickness, color, normal=(0, 0, 1), seg=48):
    axis = Vector(normal).normalized()
    xaxis = axis.cross(Vector((0, 0, 1))) if abs(axis.z) < .98 else Vector((1, 0, 0))
    xaxis.normalize()
    yaxis = axis.cross(xaxis).normalized()
    ps = [Vector(center) + radius * (math.cos(j * TAU / seg) * xaxis + math.sin(j * TAU / seg) * yaxis) for j in range(seg + 1)]
    return limb(name, ps, [thickness] * len(ps), color, seg=8, steps=1, flute=0)


def leaf(name, origin, tip, width, color):
    o, t = Vector(origin), Vector(tip)
    d = t - o
    side = d.cross(Vector((0, 0, 1)))
    if side.length < .01:
        side = Vector((1, 0, 0))
    side.normalize()
    verts, faces = [], []
    for i in range(7):
        s = i / 6
        center = o + d * s + Vector((0, 0, math.sin(math.pi * s) * width * .24))
        w = math.sin(math.pi * s) ** .8 * width
        verts.extend([tuple(center - side * w), tuple(center + Vector((0, 0, w * .12))), tuple(center + side * w)])
    for i in range(6):
        for j in range(2):
            a = i * 3 + j
            faces.append((a, a + 1, a + 4, a + 3))
    obj = mesh(name, verts, faces, color)
    sol = obj.modifiers.new("Leaf body", "SOLIDIFY")
    sol.thickness = .018
    return obj


def fern(center, size=1):
    for i in range(6):
        a = i * TAU / 6 + .2
        direction = Vector((math.cos(a), math.sin(a), 0))
        start = Vector(center)
        tip = start + direction * size * .7 + Vector((0, 0, size * .65))
        middle = start + direction * size * .26 + Vector((0, 0, size * .58))
        limb("Fern_stem", [start, middle, tip], [.013 * size, .012 * size, .002], "moss_light", seg=6, steps=3, flute=0)
        for j in range(1, 6):
            s = j / 7
            p = start.lerp(tip, s) + Vector((0, 0, math.sin(math.pi * s) * size * .18))
            for sign in (-1, 1):
                lateral = Vector((-direction.y, direction.x, 0)) * sign
                end = p + (lateral * .22 * (1 - .6 * s) + direction * .15) * size
                leaf("Fern_leaf", p, end, size * .072 * (1 - .4 * s), "fern" if j % 2 else "leaf")


def roots(width=1, height=1, seg=16, steps=5):
    for i in range(8):
        a = i * TAU / 8 + .16
        x, y = math.cos(a), math.sin(a)
        limb("Sculpted_root", [(x * .28 * width, y * .28 * width, height * .68),
            (x * .67 * width, y * .67 * width, height * .22),
            (x * 1.21 * width, y * 1.21 * width, .08),
            (x * 1.72 * width + .12 * y, y * 1.72 * width, .025)],
            [.25 * width, .29 * width, .13 * width, .016], "bark", seg=seg, steps=steps)


def bark_ridges_from_surface(trunk, seg, indices):
    """Follow the actual exported trunk surface so no bark floats in space."""
    ring_count = len(trunk.data.vertices) // seg
    for j in indices:
        points = [trunk.data.vertices[i * seg + j].co.copy() for i in range(1, ring_count - 5)]
        sizes = [.004 + .009 * math.sin(math.pi * i / (len(points) - 1)) for i in range(len(points))]
        limb("Attached_bark_ridge", points, sizes, "bark_light", seg=5, steps=1, flute=0)


def canopy(center, scale, sage=False, seed=0, resolution=(32, 19), leaf_count=15):
    # Large interlocking lobes form a broad crown. Sparse projecting leaf tips
    # break the cloud edge and establish a botanical, soft storybook silhouette.
    for i, (dx, dy, dz, sx, sy, sz) in enumerate([
        (0, 0, .28, 1.18, .99, .75), (-.78, -.08, 0, .92, .79, .63),
        (.72, .13, .07, .94, .81, .7), (-.12, -.62, -.17, 1.03, .67, .59),
        (.04, .55, -.09, 1.02, .74, .65), (-.28, .05, .68, .78, .69, .49),
    ]):
        c = tuple(center[k] + (dx, dy, dz)[k] * scale[k] for k in range(3))
        s = (sx * scale[0], sy * scale[1], sz * scale[2])
        colors = ["sage", "sage_light", "leaf"] if sage else ["leaf", "leaf_light", "leaf_dark"]
        surface("Sculpted_foliage", c, s, colors[(i + seed) % 3], seed=seed + i * 1.2,
            seg=resolution[0], rings=resolution[1], wrinkle=.09)
    for i in range(leaf_count):
        a = i * TAU / leaf_count + seed
        c = Vector(center) + Vector((math.cos(a) * scale[0] * 1.47, math.sin(a) * scale[1] * 1.12, -.06 * scale[2]))
        tip = c + Vector((math.cos(a) * .47, math.sin(a) * .47, .25))
        leaf("Crown_leaf", c, tip, .15, "sage_light" if sage else "leaf_light")


def tree():
    # Frequent forest instance: preserve the continuous curves and crown lobes,
    # reduce their over-sampling and sparse decorative leaf tips at game scale.
    roots(.62, .95, seg=12, steps=4)
    trunk = limb("Twisting_trunk", [(0, 0, .3), (.13, .02, 1.15), (-.07, .09, 2.5), (.25, .13, 3.8), (.10, .1, 5.15), (.35, 0, 6.5)],
        [.47, .46, .36, .28, .17, .028], "bark", seg=20, steps=6, flute=.11)
    bark_ridges_from_surface(trunk, 20, (0, 3, 7, 10, 13, 17))
    for i, (end, bend) in enumerate([
        ((-1.65, .07, 5.55), (-.95, .09, 4.45)), ((1.75, .25, 5.65), (.95, .15, 4.75)),
        ((-.55, -1.05, 5.23), (-.3, -.75, 4.4)), ((.2, 1.1, 5.8), (.1, .85, 4.75))]):
        limb("Curved_branch", [(0, 0, 2.8 + i * .23), bend, end], [.26, .17, .026], "bark", seg=12, steps=6)
    canopy((-.95, -.07, 5.36), (1.25, 1.12, .98), seed=2, resolution=(24, 14), leaf_count=9)
    canopy((1.07, .13, 5.67), (1.27, 1.03, 1.0), seed=5, resolution=(24, 14), leaf_count=9)
    canopy((.13, .25, 6.4), (1.22, .92, .73), seed=8, resolution=(24, 14), leaf_count=9)
    for c, s in [((-.55, -.32, .06), (.47, .26, .08)), ((.56, .14, .08), (.52, .33, .1))]:
        surface("Moss_on_root", c, s, "moss", seg=20, rings=10, wrinkle=.12)


def mushroom(center, size=1, phase=0, color="coral"):
    x, y, z = center
    limb("Mushroom_stalk", [(x, y, z + .025), (x + .04 * size, y, z + .3 * size), (x - .02 * size, y + .03 * size, z + .72 * size)],
        [.14 * size, .1 * size, .14 * size], "cream", seg=16, steps=5, flute=.02)
    profile = [(0, .60), (.22, .6), (.45, .61), (.53, .65), (.54, .71), (.48, .81), (.34, .95), (.15, 1.04), (0, 1.065)]
    cap = lathe("Mushroom_cap", [(r * size, h * size) for r, h in profile], center, color, seg=40, uneven=.025, phase=phase)
    for i in range(8):
        a = i * TAU / 8 + phase
        rr = (.15 + (i % 3) * .09) * size
        zz = size * (1.065 - .45 * (rr / (.54 * size)) ** 1.8)
        spot = surface("Cap_freckle", (x + math.cos(a) * rr, y + math.sin(a) * rr, z + zz + .005 * size),
            (.052 * size, .055 * size, .014 * size), "cream", seg=14, rings=8, wrinkle=.05)
    for i in range(12):
        a = i * TAU / 12
        limb("Mushroom_gill", [(x + .1 * size * math.cos(a), y + .1 * size * math.sin(a), z + .605 * size),
            (x + .47 * size * math.cos(a), y + .47 * size * math.sin(a), z + .63 * size)], [.006 * size, .004 * size],
            "gill", seg=5, steps=1, flute=0)
    return cap


def mushrooms():
    for i, (c, s) in enumerate([((-.35, .14, 0), 1.16), ((.4, .18, 0), .91), ((.03, -.37, 0), .66), ((-.5, -.38, 0), .4), ((.57, -.33, 0), .39)]):
        mushroom(c, s, i * 1.7, "coral" if i % 2 else "roof_light")
    fern((.58, .5, 0), .65)


def cottage():
    profile = [(0, 0), (1.23, 0), (1.40, .12), (1.45, .4), (1.39, .9), (1.30, 1.5),
        (1.24, 2.1), (1.32, 2.7), (1.46, 3.18), (0, 3.22)]
    wall = lathe("Rounded_stucco_wall", profile, (0, 0, 0), "stucco", seg=72, uneven=.025)
    # Portal disks and rim lie on the curved wall front, in Blender -Y.
    surface("Door_recess", (0, -1.337, 1.10), (.78, .13, 1.04), "bark_dark", seg=40, rings=24, wrinkle=.015)
    surface("Round_sage_door", (0, -1.435, 1.13), (.67, .074, .93), "door", seg=40, rings=24, wrinkle=.008)
    arc = [(math.cos(j * TAU / 72) * .735, -1.433, 1.12 + math.sin(j * TAU / 72) * 1.00) for j in range(73)]
    limb("Doorframe", arc, [.10] * len(arc), "bark", seg=10, steps=1, flute=.02)
    for x in (-.42, -.21, 0, .21, .42):
        height = .89 * math.sqrt(1 - (x / .67) ** 2)
        limb("Door_board_seam", [(x, -1.51, 1.13 - height), (x, -1.516, 1.13), (x, -1.51, 1.13 + height)],
            [.012, .012, .012], "door_dark", seg=5, steps=2, flute=0)
    for z in (.67, 1.57):
        limb("Curved_door_strap", [(-.49, -1.535, z), (-.31, -1.54, z + .018), (-.12, -1.54, z)],
            [.035, .04, .024], "brass", seg=8, steps=3, flute=0)
    surface("Round_brass_handle", (.39, -1.56, 1.10), (.071, .072, .071), "brass", seg=18, rings=12)
    for x, y, z, a in [(-.95, -.9, 2.2, -.7), (.95, -.9, 2.2, .7), (1.29, .08, 1.65, 1.57)]:
        n = Vector((math.sin(a), -math.cos(a), 0))
        window = surface("Window_glow", (x, y, z), (.35, .06, .35), "cream", seg=28, rings=18, wrinkle=.008)
        # Rotate the locally flattened window around its own center.
        for v in window.data.vertices:
            q = v.co - Vector((x, y, z))
            v.co = Vector((x, y, z)) + Vector((q.x * math.cos(a) - q.y * math.sin(a), q.x * math.sin(a) + q.y * math.cos(a), q.z))
        ring("Window_wood_rim", (x + n.x * .025, y + n.y * .025, z), .39, .065, "bark", normal=n)
        horizontal = Vector((math.cos(a), math.sin(a), 0))
        c = Vector((x, y, z)) + n * .064
        limb("Window_mullion", [c - horizontal * .32, c + horizontal * .32], [.021, .021], "bark", seg=6, steps=1, flute=0)
        limb("Window_mullion", [c + Vector((0, 0, -.32)), c + Vector((0, 0, .32))], [.021, .021], "bark", seg=6, steps=1, flute=0)
    roof_profile = [(0, 3.13), (.5, 3.14), (1.4, 3.13), (2.25, 3.04), (2.6, 3.12),
        (2.7, 3.28), (2.65, 3.43), (2.49, 3.63), (2.17, 3.93), (1.76, 4.28), (1.3, 4.57), (.75, 4.79), (.30, 4.87), (0, 4.9)]
    lathe("Mushroom_roof_sculpture", roof_profile, (0, 0, 0), "coral", seg=96, uneven=.024, phase=.7)
    ring("Soft_roof_lip", (0, 0, 3.24), 2.67, .068, "roof_light", seg=96)
    for i in range(44):
        a = i * TAU / 44
        limb("Roof_underside_gill", [(1.24 * math.cos(a), 1.24 * math.sin(a), 3.105),
            (1.85 * math.cos(a), 1.85 * math.sin(a), 3.025), (2.55 * math.cos(a), 2.55 * math.sin(a), 3.115)],
            [.018, .025, .012], "gill", seg=6, steps=3, flute=0)
    # Roof spots are authored plaques conforming to the umbrella slope.
    for i, (a, r, size) in enumerate([(0.2, .5, .18), (1.8, .7, .14), (3.3, .9, .21), (4.9, .55, .14),
        (.4, 1.65, .25), (1.45, 1.8, .19), (2.4, 1.55, .2), (3.45, 1.9, .23), (4.3, 1.7, .26), (5.3, 1.8, .19),
        (5.9, 2.3, .17), (3, 2.35, .13), (4.9, 2.35, .12)]):
        # Roof surface interpolated between its authored radial profile rings.
        top = list(reversed(roof_profile[5:]))
        z = top[-1][1]
        slope = 0
        for (r0, z0), (r1, z1) in zip(top, top[1:]):
            if r0 <= r <= r1:
                slope = (z1 - z0) / (r1 - r0)
                z = z0 + (r - r0) * slope
                break
        c = Vector((r * math.cos(a), r * math.sin(a), z + .035))
        spot = surface("Ivory_roof_spot", c, (size, size * .86, .025), "cream", seed=i, seg=20, rings=10, wrinkle=.06)
        for v in spot.data.vertices:
            q = v.co - c
            v.co.z += slope * (q.x * math.cos(a) + q.y * math.sin(a))
    for x, y, z, sx, sy in [(0, -1.4, .27, .87, .61), (0, -1.96, .17, .99, .57), (0, -2.47, .065, 1.09, .47)]:
        surface("Worn_stone_step", (x, y, z), (sx, sy, .135 if z > .2 else .09), "stone", seg=40, rings=12, wrinkle=.06)
    # Hand-built crooked chimney, soft rim, and a small over-door leaf awning.
    limb("Crooked_chimney", [(1.13, .48, 3.7), (1.33, .53, 4.23), (1.3, .57, 4.71), (1.38, .58, 5.12)],
        [.25, .21, .18, .22], "stucco_shade", seg=20, steps=6, flute=.03)
    ring("Chimney_lip", (1.38, .58, 5.12), .215, .075, "cream")
    surface("Chimney_dark_opening", (1.38, .58, 5.128), (.145, .145, .025), "bark_dark", seg=20, rings=10)
    for j in range(2):
        x = -1.3 if j == 0 else 1.38
        y = -.43 if j == 0 else -.22
        limb("Climbing_vine", [(x, y, .08), (x * .95, y - .12, .6), (x * .92, y - .19, 1.2), (x * .9, y - .23, 1.87)],
            [.029, .028, .022, .006], "fern", seg=6, steps=4, flute=0)
        for k in range(8):
            p = Vector((x * (.99 - k * .012), y - k * .028, .23 + k * .2))
            tip = p + Vector(((-1 if k % 2 else 1) * .22, -.05, .14))
            leaf("Ivy_leaf", p, tip, .13, "leaf" if k % 2 else "leaf_light")
    fern((-1.42, -.6, 0), .75)
    fern((1.5, -.45, 0), .64)
    mushroom((-1.76, -.61, 0), .61, phase=.4)
    mushroom((1.76, .53, 0), .48, phase=2)


def lantern_tree():
    roots(1.15, 1.6)
    main_points = [(0, 0, .37), (-.22, .07, 1.2), (.12, .16, 2.4), (.44, .23, 3.85),
        (.24, .13, 5.12), (-.35, .11, 6.65), (-.6, .12, 8.2), (-.32, .15, 9.05)]
    main_radii = [.85, .75, .63, .55, .43, .33, .19, .03]
    trunk = limb("Ancient_twisting_trunk", main_points, main_radii, "bark", seg=28, steps=8, flute=.1)
    bark_ridges_from_surface(trunk, 28, (0, 4, 8, 12, 16, 20, 24))
    for i, (ps, rs) in enumerate([
        ([(.25, .15, 3.7), (-.9, -.05, 5.1), (-2.3, .1, 6.6), (-3.1, .05, 7.1)], [.52, .36, .23, .025]),
        ([(.27, .15, 4.35), (1.25, .3, 5.5), (2.8, .05, 6.7), (3.2, -.05, 7.6)], [.45, .33, .2, .024]),
        ([(-.2, .15, 6.0), (-1.45, -.2, 6.7), (-1.4, -.7, 8.4)], [.3, .2, .02]),
        ([(-.1, .15, 6.4), (1.3, .25, 7.7), (1.6, .15, 8.7)], [.3, .18, .02]),
        ([(.12, .16, 3.2), (.4, 1.1, 5.25), (.22, 2.05, 7.1)], [.34, .21, .03]),
    ]):
        limb("Broad_ancient_branch", ps, rs, "bark", seg=20, steps=8, flute=.1)
    # Concentric whorls are a real carved trunk detail, not a flat graphic.
    centerline = catmull(main_points, 48)
    widths = catmull([(r, 0, 0) for r in main_radii], 48)
    for r in (.19, .29, .39):
        ps = []
        for a in range(65):
            z = 2.5 + math.sin(a * TAU / 64) * r * 1.5
            index = min(range(len(centerline)), key=lambda k: abs(centerline[k].z - z))
            center = centerline[index]
            x = math.cos(a * TAU / 64) * r
            y = center.y - math.sqrt(max(.01, widths[index].x ** 2 - x ** 2)) - .008
            ps.append((center.x + x, y, z))
        limb("Attached_trunk_knot", ps, [.012] * len(ps), "bark_dark" if r < .3 else "bark_light", seg=7, steps=1, flute=0)
    canopy((-2.3, .12, 7.5), (1.55, 1.20, .9), sage=True, seed=3)
    canopy((2.20, .12, 7.78), (1.55, 1.21, .93), sage=True, seed=7)
    canopy((-.72, .25, 8.78), (1.65, 1.32, .9), sage=True, seed=9)
    canopy((.4, 1.10, 7.57), (1.62, 1.21, .81), sage=True, seed=1)
    # All glowing bulb surfaces retain stable names for runtime restoration.
    lamps = [(-2.95, -.52, 5.05, 6.95), (-1.87, -.92, 4.62, 6.47),
        (-.78, -.82, 5.90, 7.45), (.74, -.70, 5.40, 7.50),
        (1.88, -.82, 4.94, 6.73), (2.94, -.50, 5.64, 7.48)]
    for i, (x, y, z, top) in enumerate(lamps, 1):
        limb("Lantern_hanging_cord", [(x, y, top), (x + .075, y - .02, (z + top) * .5), (x, y, z + .49)],
            [.015, .013, .014], "brass", seg=7, steps=5, flute=0)
        ring("Lantern_handle", (x, y, z + .43), .12, .018, "brass", normal=(0, -1, 0), seg=24)
        lathe("Lantern_copper_crown", [(0, .40), (.13, .37), (.26, .27), (.245, .235), (0, .23)], (x, y, z), "brass", seg=32, uneven=.015)
        lathe("Lantern_copper_foot", [(0, -.28), (.13, -.285), (.21, -.24), (.23, -.205), (.22, -.17), (0, -.17)], (x, y, z), "brass", seg=32, uneven=.01)
        bulb = surface(f"Lantern_{i}", (x, y, z + .015), (.215, .215, .27), rgba("FFD38A"), seg=28, rings=18, wrinkle=.025)
        colorize(bulb, rgba("FFD38A"), LAMP, variation=.035)
        bulb["runtime_role"] = "restoration_lantern"
        bulb["lantern_index"] = i
        for j in range(4):
            a = (j + .5) * TAU / 4
            limb("Lantern_cage_rib", [(x + .185 * math.cos(a), y + .185 * math.sin(a), z - .20),
                (x + .229 * math.cos(a), y + .229 * math.sin(a), z + .005),
                (x + .18 * math.cos(a), y + .18 * math.sin(a), z + .235)],
                [.013, .013, .013], "brass", seg=6, steps=4, flute=0)
    for i in range(4):
        a = i * TAU / 4 + .3
        surface("Root_moss", (math.cos(a) * 1.0, math.sin(a) * .96, .06), (.56, .34, .12), "moss", seg=24, rings=10, wrinkle=.16)
    fern((-1.3, .55, 0), 1.0)
    mushroom((.75, -.76, .1), .42, phase=2)


def rock():
    obj = surface("Rounded_weathered_rock", (0, 0, .58), (1.12, .83, .69), "stone", seed=7, seg=36, rings=24, wrinkle=.17)
    for v in obj.data.vertices:
        v.co.z = max(.012, v.co.z)
    for c, s in [((-.24, .06, 1.12), (.7, .61, .095)), ((.45, -.02, .99), (.41, .46, .09)), ((-.58, -.2, .93), (.30, .32, .11))]:
        surface("Sculpted_moss_cushion", c, s, "moss", seed=4, seg=28, rings=12, wrinkle=.14)
    for i in range(12):
        a = i * TAU / 12
        surface("Stone_lichen", (math.cos(a) * .69, math.sin(a) * .5, .95 + .06 * math.sin(a)), (.05, .042, .015), "lichen", seed=i, seg=10, rings=6)


def bake_modifiers(obj):
    bpy.context.view_layer.objects.active = obj
    for modifier in list(obj.modifiers):
        bpy.ops.object.modifier_apply(modifier=modifier.name)


def asset(name, builder, gallery_x):
    previous = set(bpy.context.scene.objects)
    builder()
    objects = [o for o in bpy.context.scene.objects if o not in previous]
    for obj in objects:
        bake_modifiers(obj)
    # Static paint has one draw call. Bulbs deliberately retain their identity.
    lamps = [o for o in objects if o.get("runtime_role") == "restoration_lantern"]
    static = [o for o in objects if o not in lamps]
    bpy.ops.object.select_all(action="DESELECT")
    for obj in static:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = static[0]
    bpy.ops.object.join()
    body = bpy.context.object
    body.name = f"{name}_PaintedSculpture"
    # Joining identical material slots can retain duplicate indices; remap once.
    body.data.materials.clear()
    body.data.materials.append(PAINT)
    for poly in body.data.polygons:
        poly.material_index = 0
    objects = [body] + lamps
    root = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(root)
    root["origin"] = "ground center"
    root["authoring"] = "Original curved and sculpted woodland asset by OpenAI Codex for LiteracyPath"
    for obj in objects:
        obj.parent = root
    # Normalize vertical bottom to the ground, retain handcrafted X/Y center.
    min_z = min((obj.matrix_world @ v.co).z for obj in objects for v in obj.data.vertices)
    for obj in objects:
        for v in obj.data.vertices:
            v.co.z -= min_z
    bpy.ops.object.select_all(action="DESELECT")
    root.select_set(True)
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = root
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"{name}.glb"
    bpy.ops.export_scene.gltf(filepath=str(path), export_format="GLB", use_selection=True,
        export_yup=True, export_apply=True, export_animations=False, export_cameras=False,
        export_lights=False, export_extras=True, export_materials="EXPORT")
    xyz = [obj.matrix_world @ v.co for obj in objects for v in obj.data.vertices]
    lo = [min(v[k] for v in xyz) for k in range(3)]
    hi = [max(v[k] for v in xyz) for k in range(3)]
    dimensions = [round(hi[0] - lo[0], 3), round(hi[2] - lo[2], 3), round(hi[1] - lo[1], 3)]
    record = {"name": name, "path": str(path.relative_to(ROOT)), "bytes": path.stat().st_size,
        "dimensions_xyz_gltf_m": dimensions, "mesh_count": len(objects),
        "vertices": sum(len(o.data.vertices) for o in objects),
        "triangles": sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in objects)}
    ASSETS.append(record)
    print("FOREST_ASSET " + json.dumps(record), flush=True)
    root.location.x = gallery_x
    return root


def camera_at(location, target, ortho=24):
    bpy.ops.object.camera_add(location=location)
    camera = bpy.context.object
    camera.name = "Gallery_camera"
    direction = Vector(target) - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = ortho
    bpy.context.scene.camera = camera
    return camera


def area(name, location, power, size, color, target=(0, 0, 3)):
    bpy.ops.object.light_add(type="AREA", location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.energy = power
    obj.data.shape = "DISK"
    obj.data.size = size
    obj.data.color = color
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def gallery():
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 24
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 1800
    scene.render.resolution_y = 1000
    scene.render.resolution_percentage = 100
    scene.world.color = (.21, .25, .23)
    scene.world.use_nodes = True
    scene.world.node_tree.nodes["Background"].inputs["Color"].default_value = (.65, .72, .64, 1)
    scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value = .65
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
    bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -.018))
    ground = bpy.context.object
    ground.name = "Gallery_ground_not_exported"
    ground_mat = bpy.data.materials.new("Gallery_sage")
    ground_mat.diffuse_color = (.22, .3, .22, 1)
    ground.data.materials.append(ground_mat)
    area("Large_warm_key", (-4, -9, 17), 2500, 10, (1, .88, .73))
    area("Soft_sky_fill", (12, 3, 13), 1800, 9, (.70, .84, 1.0))
    area("Canopy_rim", (-10, 4, 13), 1900, 8, (1, .96, .76))
    camera_at((15, -35, 21), (1.5, 0, 4.7), 26)


def import_roundtrip(preview=None):
    """Exercise the real files through Blender's glTF importer and render them."""
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    layout = {"tree": (-7.8, 0), "cottage": (0, 0), "lantern-tree": (8.4, 0),
        "mushrooms": (-3.1, -3.6), "rock": (3.4, -3.6)}
    for record in ASSETS:
        before = set(bpy.context.scene.objects)
        bpy.ops.import_scene.gltf(filepath=str(ROOT / record["path"]))
        imported = [o for o in bpy.context.scene.objects if o not in before]
        bpy.context.view_layer.update()
        objects = [o for o in imported if o.type == "MESH"]
        assert len(objects) == record["mesh_count"], f"Mesh count changed: {record['name']}"
        coords = [o.matrix_world @ v.co for o in objects for v in o.data.vertices]
        assert all(math.isfinite(p[k]) for p in coords for k in range(3)), "Non-finite geometry"
        assert abs(min(p.z for p in coords)) < .002, f"Ground origin: {record['name']}"
        assert all(len(o.data.color_attributes) for o in objects), "Missing vertex pigment"
        if record["name"] == "lantern-tree":
            bulbs = [o for o in objects if o.name.startswith("Lantern_")]
            assert {o.name for o in bulbs} == {f"Lantern_{i}" for i in range(1, 7)}
        x, y = layout[record["name"]]
        for obj in imported:
            if obj.parent is None:
                obj.location.x += x
                obj.location.y += y
        print("FOREST_ROUNDTRIP_PASS " + record["name"], flush=True)
    gallery()
    if preview:
        bpy.context.scene.render.filepath = preview
        bpy.ops.render.render(write_still=True)


def main():
    global PAINT, LAMP
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--preview")
    parser.add_argument("--roundtrip-preview")
    parser.add_argument("--tree-only", action="store_true", help="Replace only the repeated tree export and its editable gallery model")
    opts = parser.parse_args(args)
    if opts.tree_only:
        bpy.ops.wm.open_mainfile(filepath=str(SOURCE / "forest.blend"))
        PAINT = bpy.data.materials["Woodland_Painted"]
        LAMP = bpy.data.materials["Lantern_Warm_Emission"]
        old = bpy.data.objects.get("tree")
        if old is None:
            raise RuntimeError("Editable forest gallery has no tree root")
        for obj in list(old.children_recursive) + [old]:
            data = obj.data if obj.type == "MESH" else None
            bpy.data.objects.remove(obj, do_unlink=True)
            if data is not None and data.users == 0:
                bpy.data.meshes.remove(data)
        asset("tree", tree, -7.8)
        bpy.context.preferences.filepaths.save_version = 0
        bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE / "forest.blend"))
        if opts.preview:
            bpy.context.scene.render.filepath = opts.preview
            bpy.ops.render.render(write_still=True)
        import_roundtrip(opts.roundtrip_preview)
        print("FOREST_TREE_REBUILD_COMPLETE " + json.dumps(ASSETS), flush=True)
        return
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    PAINT = material("Woodland_Painted")
    LAMP = material("Lantern_Warm_Emission", emission=True)
    asset("tree", tree, -7.8)
    asset("cottage", cottage, 0)
    asset("lantern-tree", lantern_tree, 8.4)
    small = asset("mushrooms", mushrooms, -3.1)
    small.location.y = -3.6
    stone = asset("rock", rock, 3.4)
    stone.location.y = -3.6
    gallery()
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE / "forest.blend"))
    if opts.preview:
        bpy.context.scene.render.filepath = opts.preview
        bpy.ops.render.render(write_still=True)
    import_roundtrip(opts.roundtrip_preview)
    print("FOREST_BUILD_COMPLETE " + json.dumps(ASSETS), flush=True)


if __name__ == "__main__":
    main()
