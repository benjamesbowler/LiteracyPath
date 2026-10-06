"""Original Rocket Run spacecraft derivative, using frozen canonical pilots.

Blender --background --python build_rocket_craft.py -- ROOT --world meadow
    --input-root SPORTS_ROOT [--no-render]

Source preparation only until this exporter is run under the shared production
lease. It does not execute the racing generators, reuse their clips, or modify
their sources. Local ship meshes and registered flight actions are authored here.
"""
import hashlib
import json
import math
import os
import struct
import sys
from pathlib import Path

# Importing the pure spec is safe; the Blender API is loaded inside main only.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from rocket_flight_spec import (  # noqa: E402
    CLIPS, WORLDS, CHARACTER_BONES, REST_CONTACTS, YOKE_PIVOT, CAPTURE_SOCKET, CAPTURE_RADIUS,
    BAKE_SUBSTEPS, ALLOWED_BAKE_SUBSTEPS, LOGICAL_FPS, CONTACT_TOLERANCE, LEFT_RELEASE_START, LEFT_RELEASE_END,
    baked_frame, flight_state, semantic_source_selection, rigid_elbow, celebration_free_wrist, same_quaternion_hemisphere, anatomical_bend_frame,
)


def argument(name, default=None):
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    return args[args.index(name) + 1] if name in args else default


def main():
    import bpy
    from mathutils import Matrix, Quaternion, Vector

    root = Path(argument("ROOT") or (sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else Path(__file__).resolve().parents[3])).resolve()
    input_root = Path(argument("--input-root", str(root))).resolve()
    world = argument("--world", "meadow")
    if world not in WORLDS:
        raise ValueError("Expected meadow, dino or moonwood")
    spec = WORLDS[world]
    bake_substeps = int(argument("--bake-substeps", BAKE_SUBSTEPS))
    if bake_substeps not in ALLOWED_BAKE_SUBSTEPS:
        raise ValueError("Expected a finite declared bake density of 1, 2, 4 or 8")
    character, character_id = spec["character"], spec["characterId"]
    input_relative = "source-art/arcade/sound-racer-3d/" + character_id + "-kart-v2.blend"
    input_path = input_root / input_relative
    input_hash = hashlib.sha256(input_path.read_bytes()).hexdigest()
    if input_hash != spec["inputSha256"]:
        raise ValueError("The canonical editable input changed; inspect its authority before exporting")
    src = root / "source-art/arcade/rocket-run"
    out = root / "public/game-assets/rocket-run/models"
    qa = root / ".artifacts/arcade-standard-upgrade/rocket-craft-production" / world
    src.mkdir(parents=True, exist_ok=True)
    out.mkdir(parents=True, exist_ok=True)
    qa.mkdir(parents=True, exist_ok=True)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    with bpy.data.libraries.load(str(input_path), link=False) as (source, target):
        target.objects = semantic_source_selection(source.objects, world)
    loaded = [obj for obj in target.objects if obj]
    for obj in loaded:
        bpy.context.scene.collection.objects.link(obj)
    rig = bpy.data.objects[character + "KartRig"]
    rig.name = character + "FlightRig"
    rig.data.name = character + "FlightSemanticRig"
    rig.animation_data_clear()
    for obj in loaded:
        obj.animation_data_clear()

    def canonical_surfaces():
        results = {}
        for obj in loaded:
            if obj.type != "MESH":
                continue
            digest = hashlib.sha256()
            for vertex in obj.data.vertices:
                digest.update(struct.pack("<3d", *vertex.co))
                for group in sorted(vertex.groups, key=lambda row: row.group):
                    name = obj.vertex_groups[group.group].name
                    # The declared chassis-to-flightRoot semantic rename
                    # preserves the exact original numeric membership/weight.
                    digest.update(("flightRoot" if name == "chassis" else name).encode())
                    digest.update(struct.pack("<d", group.weight))
            for polygon in obj.data.polygons:
                digest.update(struct.pack("<" + "I" * len(polygon.vertices), *polygon.vertices))
            for layer in obj.data.uv_layers:
                for loop in layer.data:
                    digest.update(struct.pack("<2d", *loop.uv))
            for mat in obj.data.materials:
                digest.update(mat.name.encode())
            results[obj.name] = {"sha256": digest.hexdigest(), "vertices": len(obj.data.vertices),
                                 "uvLayers": len(obj.data.uv_layers), "weightGroups": len(obj.vertex_groups)}
        return results

    original_surfaces = canonical_surfaces()
    # Keep the original canonical physical endpoints as anatomy/skin authority,
    # independently of authored target poses or helper socket locations.
    anatomical_endpoints = {bone.name: (bone.head_local.copy(), bone.tail_local.copy())
                           for bone in rig.data.bones if bone.name in CHARACTER_BONES}
    # The selected source contains individual canonical pilot surfaces only.
    # Unused wheel/steering bones are removed, never renamed into flight clips.
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    edit = rig.data.edit_bones
    for bone in list(edit):
        if bone.name not in CHARACTER_BONES and bone.name != "chassis":
            edit.remove(bone)
    edit["chassis"].name = "flightRoot"
    root_bone = edit["flightRoot"]
    # New physical supports/socket nodes belong to the original spacecraft.
    socket_defs = {
        "flightYoke": (YOKE_PIVOT, (0, .40, 1.018), "flightRoot"),
        "leftGripSocket": (REST_CONTACTS["leftGrip"], (-.232, .233, 1.068), "flightYoke"),
        "rightGripSocket": (REST_CONTACTS["rightGrip"], (.232, .233, 1.068), "flightYoke"),
        "leftFootDock": (REST_CONTACTS["leftSole"], (-.25, .79, .348), "flightRoot"),
        "rightFootDock": (REST_CONTACTS["rightSole"], (.25, .79, .348), "flightRoot"),
        "leftThruster": ((-spec["podX"], -1.32, .39), (-spec["podX"], -1.52, .39), "flightRoot"),
        "rightThruster": ((spec["podX"], -1.32, .39), (spec["podX"], -1.52, .39), "flightRoot"),
        "wordCaptureSocket": (CAPTURE_SOCKET, (0, 1.8, .59), "flightRoot"),
    }
    for name, (head, tail, parent) in socket_defs.items():
        bone = edit.new(name)
        bone.head, bone.tail, bone.parent = head, tail, edit[parent]
        bone.use_deform = name == "flightYoke"
    # Held rigid palms and their actual grips share the moving yoke ancestry.
    # Compensating an independently stretched forearm at each key does not
    # cancel glTF's interpolated TRS between keys. Preserve canonical rest
    # matrices/weights while changing only this owned derivative hierarchy.
    for side in ("L", "R"):
        for name in ("upperarm", "forearm", "hand", "thigh", "shin", "foot"):
            bone = edit[name + "." + side]
            matrix, length = bone.matrix.copy(), bone.length
            bone.use_connect = False
            bone.parent = edit["flightYoke"] if name == "hand" else root_bone
            bone.matrix, bone.length = matrix, length
    # Canonical shoulder-first ancestry keeps the actual original shoulder,
    # elbow and wrist attached under every interpolated rotation. The held
    # palm is independently tested against the unchanged physical yoke;
    # shared bone ancestry is never substituted for that support gate.
    for name, parent in (("upperarm.L", "chest"), ("forearm.L", "upperarm.L"), ("hand.L", "forearm.L")):
        bone = edit[name]
        matrix, length = bone.matrix.copy(), bone.length
        bone.parent = edit[parent]
        bone.use_connect = False
        bone.matrix, bone.length = matrix, length
    # glTF has ordinary inherited TRS and cannot encode Blender's NONE scale
    # inheritance through a stretched limb ancestor. Independent canonical
    # segments now share the rigid flight frame; actual evaluated endpoints
    # prove the visible chain still connects at keys and genuine subframes.
    # Flight roll pivots around the cockpit origin, not the old chassis height.
    root_bone.head, root_bone.tail = (0, 0, 0), (0, 0, .25)
    bpy.ops.object.mode_set(mode="OBJECT")
    # The analytic pose gives each limb its own measured length. Inherited
    # non-uniform arm stretch would otherwise shear the rigid palm; writing a
    # decomposed matrix_basis then loses that shear and moves the real grip.
    # This derivative keeps absolute authored contacts and uses Blender's
    # inheritance-aware conversion, never a looser contact threshold.
    for bone in rig.data.bones:
        bone.inherit_scale = "FULL" if bone.name in ("hand.L", "forearm.L", "upperarm.L") else "NONE"
    rig.select_set(False)
    for obj in loaded:
        if obj.type != "MESH":
            continue
        group = obj.vertex_groups.get("chassis")
        if group:
            group.name = "flightRoot"
    scene = bpy.context.scene
    scene.render.fps = LOGICAL_FPS * bake_substeps
    materials = {}

    def material(name, color, rough=.45, metal=.15, emission=0):
        mat = bpy.data.materials.new("Rocket" + name)
        mat.use_nodes = True
        mat.diffuse_color = (*color, 1)
        node = mat.node_tree.nodes.get("Principled BSDF")
        node.inputs["Base Color"].default_value = (*color, 1)
        node.inputs["Roughness"].default_value = rough
        node.inputs["Metallic"].default_value = metal
        if emission:
            node.inputs["Emission Color"].default_value = (*color, 1)
            node.inputs["Emission Strength"].default_value = emission
        materials[name] = mat
        return mat

    material("Hull", spec["hull"], .38, .19)
    material("Panel", spec["panel"], .51, .13)
    material("Accent", spec["accent"], .40, .15)
    material("Metal", spec["metal"], .30, .65)
    material("Lamp", spec["lamp"], .29, .13, .55)
    material("Seat", (.065, .085, .10), .92, 0)
    material("Recess", (.032, .045, .056), .77, .2)

    def mesh(name, verts, faces, mat, bone="flightRoot"):
        data = bpy.data.meshes.new(name)
        data.from_pydata(verts, [], faces)
        data.update()
        obj = bpy.data.objects.new(name, data)
        scene.collection.objects.link(obj)
        obj.data.materials.append(materials[mat])
        for polygon in data.polygons:
            polygon.use_smooth = True
        group = obj.vertex_groups.new(name=bone)
        group.add(list(range(len(verts))), 1, "REPLACE")
        modifier = obj.modifiers.new("OriginalFlightSkin", "ARMATURE")
        modifier.object = rig
        obj.parent = rig
        return obj

    def tube(name, points, radii, mat, bone="flightRoot", segments=12):
        verts, faces = [], []
        for j, point in enumerate(points):
            tangent = Vector(points[min(j + 1, len(points) - 1)]) - Vector(points[max(0, j - 1)])
            tangent.normalize()
            u = tangent.cross(Vector((0, 0, 1)))
            if u.length < .001:
                u = tangent.cross(Vector((0, 1, 0)))
            u.normalize()
            v = tangent.cross(u)
            for i in range(segments):
                angle = math.tau * i / segments
                verts.append(Vector(point) + (u * math.cos(angle) + v * math.sin(angle)) * radii[j])
        for j in range(len(points) - 1):
            for i in range(segments):
                faces.append((j * segments + i, j * segments + (i + 1) % segments,
                              (j + 1) * segments + (i + 1) % segments, (j + 1) * segments + i))
        faces += [tuple(reversed(range(segments))), tuple((len(points) - 1) * segments + i for i in range(segments))]
        return mesh(name, verts, faces, mat, bone)

    def oval(name, center, scale, mat, bone="flightRoot", segments=32, rows=18):
        verts, faces = [], []
        for j in range(rows + 1):
            polar = math.pi * j / rows
            for i in range(segments):
                angle = math.tau * i / segments
                verts.append((center[0] + math.sin(polar) * math.cos(angle) * scale[0],
                              center[1] + math.sin(polar) * math.sin(angle) * scale[1],
                              center[2] + math.cos(polar) * scale[2]))
        for j in range(rows):
            for i in range(segments):
                faces.append((j * segments + i, j * segments + (i + 1) % segments,
                              (j + 1) * segments + (i + 1) % segments, (j + 1) * segments + i))
        return mesh(name, verts, faces, mat, bone)

    # Continuous open cockpit, rounded toy-like belly and a visible cavity.
    # The low rear rim exposes the complete scarf/tail and both foot contacts.
    verts, faces, count = [], [], 64
    for level in range(5):
        for i in range(count):
            a = math.tau * i / count
            fore = math.sin(a)
            x = math.cos(a) * spec["width"] * (1 - .16 * max(0, fore))
            y = fore * spec["length"]
            factors = [.80, 1, 1, .75, .74]
            z = [.13, .36, .59 - .09 * max(0, -fore), .56 - .09 * max(0, -fore), .22][level]
            verts.append((x * factors[level], y * factors[level], z))
    for level in range(4):
        for i in range(count):
            faces.append((level * count + i, level * count + (i + 1) % count,
                          (level + 1) * count + (i + 1) % count, (level + 1) * count + i))
    faces += [tuple(reversed(range(count))), tuple(4 * count + i for i in range(count))]
    mesh("RocketOpenCockpitHull", verts, faces, "Hull")
    oval("RocketSeatCushion", (0, -.38, .675), (.42, .40, .11), "Seat")
    oval("RocketLowSeatBack", (0, -.73, .91), (.40, .09, .22), "Seat")
    for side, sign in [("L", -1), ("R", 1)]:
        rim = [(sign * .66, -1.11, .57), (sign * .77, -.68, .61),
               (sign * .75, .20, .62), (sign * .55, .92, .61)]
        tube("RocketCockpitRim." + side, rim, [.024] * 4, "Panel")
        oval("RocketFootDockSurface." + side, (sign * .25, .79, .274), (.135, .235, .024), "Recess")
        tube("RocketFootDockLip." + side,
             [(sign * .25 - .135, .60, .29), (sign * .25 - .135, 1.0, .29),
              (sign * .25 + .135, 1.0, .29), (sign * .25 + .135, .60, .29)],
             [.012] * 4, "Metal", segments=8)
        pod_x = sign * spec["podX"]
        # Long sculpted nacelle, recessed exit, emissive core and radial vanes.
        oval("RocketNacelle." + side, (pod_x, -.30, .39), (.215, .95, .225), "Panel")
        tube("RocketThrusterCasing." + side,
             [(pod_x, -1.02, .39), (pod_x, -1.28, .39), (pod_x, -1.40, .39)],
             [.19, .20, .18], "Metal", segments=24)
        tube("RocketThrusterDarkExit." + side, [(pod_x, -1.405, .39), (pod_x, -1.43, .39)], [.145, .145], "Recess", segments=24)
        tube("RocketThrusterLightCore." + side, [(pod_x, -1.435, .39), (pod_x, -1.445, .39)], [.109, .109], "Lamp", segments=24)
        for j in range(8):
            angle = math.tau * j / 8
            tube("RocketCoolingVane." + side,
                 [(pod_x + math.cos(angle) * .19, -1.17, .39 + math.sin(angle) * .19),
                  (pod_x + math.cos(angle) * .21, -1.30, .39 + math.sin(angle) * .21)],
                 [.012, .012], "Accent", segments=6)
        wing = [(sign * .67, -.48, .37), (sign * spec["wingTip"], -.76, .31),
                (sign * (spec["wingTip"] + .025), -.64, .25), (sign * 1.09, .55, .29),
                (sign * .72, .71, .41), (sign * .67, -.48, .30)]
        mesh("RocketSweptFin." + side, wing,
             [(0, 1, 2, 3, 4), (0, 4, 5), (5, 4, 3, 2, 1), (0, 5, 1)], "Accent")
        tube("RocketFinPanelSeam." + side,
             [(sign * .84, -.43, .395), (sign * 1.19, -.50, .335), (sign * 1.02, .33, .34)], [.009] * 3, "Panel", segments=6)
        for y in [-.8, -.45, -.10, .26, .60]:
            oval("RocketHullFastener." + side, (sign * .737, y, .465), (.012, .012, .012), "Metal", segments=10, rows=6)
        oval("RocketNavigationLamp." + side, (sign * 1.07, .24, .395), (.11, .15, .037), "Lamp", segments=20, rows=10)
    # New flight yoke is a pair of short genuine grips with an open centre.
    # Source palms remain visible above the low console; it is not a kart wheel.
    tube("RocketFlightYoke", [(-.232, .233, 1.018), (-.14, .233, .922),
                             (0, .233, .91), (.14, .233, .922), (.232, .233, 1.018)],
         [.031] * 5, "Metal", "flightYoke", segments=12)
    for side, sign in [("L", -1), ("R", 1)]:
        tube("RocketFlightGrip." + side, [(sign * .232, .205, 1.018), (sign * .232, .263, 1.018)], [.034, .034], "Recess", "flightYoke", segments=16)
    oval("RocketConsoleBrow", (0, .51, .76), (.38, .18, .095), "Panel")
    oval("RocketReadoutRecess", (0, .437, .817), (.20, .046, .020), "Recess")
    for x in [-.105, 0, .105]:
        oval("RocketStatusLight", (x, .406, .829), (.023, .018, .012), "Lamp", segments=16, rows=8)
    # A low sculpted prow and seams distinguish the long hull from a capsule.
    oval("RocketProw", (0, 1.17, .43), (.43, .51, .175), "Panel")
    tube("RocketProwSeam", [(0, .87, .612), (0, 1.18, .601), (0, 1.55, .50)], [.009] * 3, "Accent", segments=8)
    # A readable front receiver, rather than an invisible wide wing collider.
    # The first swept contact is centred on wordCaptureSocket; an armed word
    # passes through the actual ring and receives local capture feedback.
    for side, sign in [("L", -1), ("R", 1)]:
        tube("RocketReceiverStrut." + side,
             [(sign * .25, 1.36, .49), (sign * .28, 1.59, .50), (sign * .22, 1.80, .54)],
             [.024, .020, .016], "Metal", segments=12)
    ring = [(CAPTURE_RADIUS * math.cos(index * math.tau / 32), CAPTURE_SOCKET[1],
             CAPTURE_SOCKET[2] + CAPTURE_RADIUS * math.sin(index * math.tau / 32)) for index in range(33)]
    tube("RocketWordReceiverRing", ring, [.017] * len(ring), "Metal", segments=10)
    for index in range(4):
        angle = index * math.tau / 4
        oval("RocketReceiverBeacon", (CAPTURE_RADIUS * math.cos(angle), CAPTURE_SOCKET[1] - .014,
                                      CAPTURE_SOCKET[2] + CAPTURE_RADIUS * math.sin(angle)),
             (.029, .024, .029), "Lamp", segments=16, rows=10)
    if world == "moonwood":
        tube("RocketLanternCanopyArch", [(-.56, -.82, .64), (-.57, -.99, 1.14),
                                          (0, -1.01, 1.48), (.57, -.99, 1.14), (.56, -.82, .64)],
             [.026] * 5, "Metal", segments=12)
        for side, sign in [("L", -1), ("R", 1)]:
            oval("RocketLanternPod." + side, (sign * .59, -.94, .94), (.045, .045, .082), "Lamp", segments=20, rows=12)
    elif world == "dino":
        for side, sign in [("L", -1), ("R", 1)]:
            tube("RocketFossilPanelArc." + side,
                 [(sign * .75, -.64, .62), (sign * .88, -.25, .60), (sign * .78, .22, .60)], [.021] * 3, "Metal", segments=10)
    else:
        for side, sign in [("L", -1), ("R", 1)]:
            tube("RocketScarfRedTip." + side, [(sign * 1.17, -.55, .34), (sign * 1.44, -.72, .32)], [.031, .025], "Accent", segments=10)

    rest = {bone.name: (bone.head_local.copy(), bone.tail_local.copy(), bone.parent.name if bone.parent else None,
                        bone.matrix_local.copy()) for bone in rig.data.bones}
    original_bend_normal = ((anatomical_endpoints["upperarm.L"][1] - anatomical_endpoints["upperarm.L"][0])
                            .cross(anatomical_endpoints["forearm.L"][1] - anatomical_endpoints["forearm.L"][0]))
    ordered = sorted(rest, key=lambda name: len(rig.data.bones[name].parent_recursive))
    actual_samples = []
    joint_pairs = {side.lower() + name: {"fromBone": first + "." + side,
                                        "toBone": second + "." + side,
                                        "fromSourcePoint": list(anatomical_endpoints[first + "." + side][1]),
                                        "toSourcePoint": list(anatomical_endpoints[second + "." + side][0])}
                   for side in ("L", "R")
                   for name, first, second in (("Wrist", "forearm", "hand"), ("Elbow", "upperarm", "forearm"),
                                              ("Ankle", "shin", "foot"), ("Knee", "thigh", "shin"))}
    subframe_summary = {"threshold": CONTACT_TOLERANCE, "sampledPoses": 0, "supportedContacts": 0,
                        "jointSamples": 0, "maximumContactSeparation": 0, "maximumJointSeparation": 0,
                        "clips": {}}
    torso_pairs = {side.lower() + "Shoulder": {"fromBone": "upperarm." + side, "toBone": "chest",
                    "fromSourcePoint": list(anatomical_endpoints["upperarm." + side][0]),
                    "toSourcePoint": list(anatomical_endpoints["upperarm." + side][0])} for side in ("L", "R")}
    shoulder_observation = {"status": "Actual original shoulder-versus-torso skin attachment, strict existing tolerance",
                            "samples": 0, "maximumSeparation": 0, "releasedWaveMaximum": 0,
                            "worst": None, "worstReleased": None, "clips": {}}
    gate_progress = {"status": "RUNNING source-only contact/joint evaluation", "world": world,
                     "bakeSubsteps": bake_substeps, "threshold": CONTACT_TOLERANCE,
                     "keyPoses": 0, "subframePoses": 0, "supportedContacts": 0, "jointSamples": 0,
                     "maximumContactSeparation": 0, "maximumJointSeparation": 0, "clips": {},
                     "failureCount": 0, "failureKinds": {}, "failureExamples": []}
    collect_source_failures = "--source-gate-only" in sys.argv
    progress_path = qa / ("source-gate-density-" + str(bake_substeps) + ".partial.json")

    def save_gate_progress(failure=None):
        record = {**gate_progress, "canonicalSurfaces": canonical_surfaces(),
                  "canonicalSurfaceEquality": canonical_surfaces() == original_surfaces,
                  "outputModelWritten": False}
        if failure:
            record["status"], record["failure"] = "FAIL actual source geometry", failure
        progress_path.write_text(json.dumps(record, indent=2) + "\n")

    def evaluated_contacts(state):
        contacts = {}
        for name, point in REST_CONTACTS.items():
            side = "L" if name.startswith("left") else "R"
            bone_name = ("hand." if name.endswith("Grip") else "foot.") + side
            support_name = name + "Socket" if name.endswith("Grip") else name.replace("Sole", "FootDock")
            skin_point = rig.pose.bones[bone_name].matrix @ rest[bone_name][3].inverted() @ Vector(point)
            support_point = rig.pose.bones[support_name].matrix.translation
            contact = not (name == "leftGrip" and state["releasedLeft"])
            separation = (skin_point - support_point).length
            contacts[name] = {"point": list(skin_point), "support": list(support_point),
                              "contact": contact, "separation": separation,
                              "sourceBone": bone_name, "sourceSurfacePoint": list(point)}
        return contacts

    def evaluated_joints():
        joints = {}
        for name, pair in joint_pairs.items():
            points = [rig.pose.bones[pair[edge + "Bone"]].matrix
                      @ rest[pair[edge + "Bone"]][3].inverted() @ Vector(pair[edge + "SourcePoint"])
                      for edge in ("from", "to")]
            joints[name] = {"separation": (points[0] - points[1]).length,
                            "from": list(points[0]), "to": list(points[1])}
        return joints

    def gate_pose(clip, frame, contacts, joints, stage="key"):
        shoulder_failures = []
        for name, pair in torso_pairs.items():
            points = [rig.pose.bones[pair[edge + "Bone"]].matrix
                      @ rest[pair[edge + "Bone"]][3].inverted() @ Vector(pair[edge + "SourcePoint"])
                      for edge in ("from", "to")]
            separation = (points[0] - points[1]).length
            observation = {"clip": clip, "frame": frame, "stage": stage, "name": name,
                           "separation": separation, "shoulder": list(points[0]), "torso": list(points[1])}
            if separation > CONTACT_TOLERANCE:
                shoulder_failures.append({"clip": clip, "frame": frame, "stage": stage, "kind": "shoulder-attachment",
                                          "name": name, "separation": separation, "shoulder": list(points[0]), "torso": list(points[1])})
            shoulder_observation["samples"] += 1
            per_shoulder_clip = shoulder_observation["clips"].setdefault(clip, {"samples": 0, "maximumSeparation": 0})
            per_shoulder_clip["samples"] += 1
            per_shoulder_clip["maximumSeparation"] = max(per_shoulder_clip["maximumSeparation"], separation)
            if separation > shoulder_observation["maximumSeparation"]:
                shoulder_observation["maximumSeparation"], shoulder_observation["worst"] = separation, observation
            if clip == "celebrate" and separation > shoulder_observation["releasedWaveMaximum"]:
                shoulder_observation["releasedWaveMaximum"], shoulder_observation["worstReleased"] = separation, observation
        supported = [row["separation"] for row in contacts.values() if row["contact"]]
        maximum_contact, maximum_joint = max(supported), max(row["separation"] for row in joints.values())
        gate_progress["keyPoses" if stage == "key" else "subframePoses"] += 1
        gate_progress["supportedContacts"] += len(supported)
        gate_progress["jointSamples"] += len(joints)
        gate_progress["maximumContactSeparation"] = max(gate_progress["maximumContactSeparation"], maximum_contact)
        gate_progress["maximumJointSeparation"] = max(gate_progress["maximumJointSeparation"], maximum_joint)
        per_clip = gate_progress["clips"].setdefault(clip, {"keyPoses": 0, "subframePoses": 0,
                                  "maximumContactSeparation": 0, "maximumJointSeparation": 0})
        per_clip["keyPoses" if stage == "key" else "subframePoses"] += 1
        per_clip["maximumContactSeparation"] = max(per_clip["maximumContactSeparation"], maximum_contact)
        per_clip["maximumJointSeparation"] = max(per_clip["maximumJointSeparation"], maximum_joint)
        failures = list(shoulder_failures)
        for name, row in contacts.items():
            if row["contact"] and row["separation"] > CONTACT_TOLERANCE:
                failures.append({"clip": clip, "frame": frame, "stage": stage, "kind": "contact",
                                 "name": name, "separation": row["separation"]})
        for name, row in joints.items():
            if row["separation"] > CONTACT_TOLERANCE:
                failures.append({"clip": clip, "frame": frame, "stage": stage, "kind": "joint",
                                 "name": name, "separation": row["separation"]})
        for failure in failures:
            gate_progress["failureCount"] += 1
            key = failure["clip"] + "/" + failure["kind"] + "/" + failure["name"]
            gate_progress["failureKinds"][key] = gate_progress["failureKinds"].get(key, 0) + 1
            if len(gate_progress["failureExamples"]) < 32:
                gate_progress["failureExamples"].append({**failure, "contacts": contacts, "joints": joints})
        if failures and not collect_source_failures:
            save_gate_progress(gate_progress["failureExamples"][0])
            failure = failures[0]
            raise ValueError(f"Actual flight {failure['kind']} geometry failed: {clip}/{frame}/{failure['name']}: {failure['separation']}")
    quaternion_continuity = {"equivalentSignCorrections": 0, "minimumAdjacentDot": 1, "examples": []}
    rig.animation_data_create()
    for clip, end in CLIPS.items():
        action = bpy.data.actions.new(clip)
        rig.animation_data.action = action
        previous_local_quaternions = {}
        dense_end = baked_frame(end, bake_substeps)
        for frame in range(1, dense_end + 1):
            phase = (frame - 1) / (dense_end - 1)
            state = flight_state(clip, phase)
            root_matrix = Matrix.Rotation(state["bank"], 4, "Y")
            pivot = Vector(YOKE_PIVOT)
            yoke_matrix = (Matrix.Translation(pivot + Vector((0, state["yokeY"], 0))) @
                           Matrix.Rotation(state["yokePitch"], 4, "X") @ Matrix.Translation(-pivot))
            targets, desired = {}, {}
            for name, (head, tail, parent, original) in rest.items():
                targets[name] = (head.copy(), tail.copy())
                if name.startswith("hand."):
                    targets[name] = (yoke_matrix @ head, yoke_matrix @ tail)
                elif name in ("hips", "chest", "neck", "head"):
                    factor = {"hips": .08, "chest": .55, "neck": .92, "head": 1}[name]
                    shift = Vector((state["torsoX"] * factor,
                                    state["headY"] if name == "head" else state["torsoY"] * factor, 0))
                    targets[name] = (head + shift, tail + shift)
            for side, sign in [("L", -1), ("R", 1)]:
                shoulder = anatomical_endpoints["upperarm." + side][0] + (targets["chest"][0] - rest["chest"][0])
                elbow = anatomical_endpoints["forearm." + side][0] + Vector((state["torsoX"] * .30, state["torsoY"] * .40, 0))
                wrist = targets["hand." + side][0]
                if side == "L" and state["releasedLeft"]:
                    # New finale gesture has an intentionally released palm.
                    weight = state["leftReleaseWeight"]
                    free_wrist = Vector(celebration_free_wrist(phase, state))
                    free_tail = free_wrist + Vector((-.035, .035, .055))
                    wrist = wrist.lerp(free_wrist, weight)
                    targets["hand.L"] = (wrist, targets["hand.L"][1].lerp(free_tail, weight))
                if side == "L":
                    upper_length = (anatomical_endpoints["upperarm.L"][1] - anatomical_endpoints["upperarm.L"][0]).length
                    fore_length = (anatomical_endpoints["forearm.L"][1] - anatomical_endpoints["forearm.L"][0]).length
                    elbow = Vector(rigid_elbow(shoulder, wrist, upper_length, fore_length, elbow))
                    targets["upperarm.L"], targets["forearm.L"] = (shoulder, elbow), (elbow, wrist)
                    bend_normal = (elbow - shoulder).cross(wrist - elbow)
                else:
                    targets["upperarm." + side], targets["forearm." + side] = (shoulder, elbow), (elbow, wrist)
            for name in ordered:
                head, tail, parent, original = rest[name]
                a, b = targets[name]
                if name == "flightRoot":
                    pose = root_matrix @ original
                elif name in ("flightYoke", "leftGripSocket", "rightGripSocket"):
                    pose = root_matrix @ yoke_matrix @ original
                elif name.startswith("hand.") and not (name == "hand.L" and state["releasedLeft"]):
                    # Full rigid matrix preserves the source palm orientation,
                    # not merely the wrist line's direction.
                    pose = root_matrix @ yoke_matrix @ original
                else:
                    direction = b - a
                    length = direction.length / max(.00001, (tail - head).length)
                    if name in ("forearm.L", "upperarm.L"):
                        source_frame = Matrix(anatomical_bend_frame(head, tail, original_bend_normal)).transposed()
                        target_frame = Matrix(anatomical_bend_frame(a, b, bend_normal)).transposed()
                        rotation = (target_frame @ source_frame.transposed() @ original.to_3x3()).to_quaternion()
                    else:
                        rotation = (tail - head).rotation_difference(direction) @ original.to_quaternion()
                    rigid_left = name in ("hand.L", "forearm.L", "upperarm.L")
                    pose = root_matrix @ Matrix.LocRotScale(a, rotation, Vector((1, 1 if rigid_left else length, 1)))
                desired[name] = pose
                bone = rig.pose.bones[name]
                bone.rotation_mode = "QUATERNION"
                bone.matrix_basis = (bone.bone.convert_local_to_pose(pose, original,
                                     parent_matrix=desired[parent], parent_matrix_local=rest[parent][3], invert=True)
                                     if parent else bone.bone.convert_local_to_pose(pose, original, invert=True))
                # Quaternion sign has no effect on a keyed orientation, but
                # opposite signs make LINEAR component curves cross zero.
                # Keep each clip/bone in one continuous hemisphere before
                # writing both the source and later glTF keys.
                raw = tuple(bone.rotation_quaternion)
                previous = previous_local_quaternions.get(name)
                quaternion = same_quaternion_hemisphere(raw, previous)
                if quaternion != raw:
                    quaternion_continuity["equivalentSignCorrections"] += 1
                    if len(quaternion_continuity["examples"]) < 12:
                        quaternion_continuity["examples"].append({"clip": clip, "frame": frame, "bone": name})
                if previous is not None:
                    quaternion_continuity["minimumAdjacentDot"] = min(
                        quaternion_continuity["minimumAdjacentDot"], sum(previous[i] * quaternion[i] for i in range(4)))
                bone.rotation_quaternion = quaternion
                previous_local_quaternions[name] = quaternion
                bone.keyframe_insert("location", frame=frame)
                bone.keyframe_insert("rotation_quaternion", frame=frame)
                bone.keyframe_insert("scale", frame=frame)
            scene.frame_set(frame)
            bpy.context.view_layer.update()
            contacts, joints = evaluated_contacts(state), evaluated_joints()
            gate_pose(clip, frame, contacts, joints)
            if (frame - 1) % bake_substeps == 0:
                actual_samples.append({"clip": clip, "frame": 1 + (frame - 1) // bake_substeps,
                                       "bakedFrame": frame, "phase": phase, "contacts": contacts, "joints": joints})
        # The source itself uses linear TRS just as its glTF channels do. Test
        # actual evaluated non-key times, not the analytic target or keys alone.
        curves = (action.fcurves if hasattr(action, "fcurves") else
                  [curve for layer in action.layers for strip in layer.strips
                   for bag in strip.channelbags for curve in bag.fcurves])
        if not curves:
            raise ValueError("The source action has no actual authored transform curves")
        for curve in curves:
            for key in curve.keyframe_points:
                key.interpolation = "LINEAR"
        clip_summary = {"poses": 0, "maximumContactSeparation": 0, "maximumJointSeparation": 0}
        for lower in range(1, dense_end):
            for fraction in (.123, .25, .5, .75, .876):
                frame = lower + fraction
                scene.frame_set(lower, subframe=fraction)
                bpy.context.view_layer.update()
                state = flight_state(clip, (frame - 1) / (dense_end - 1))
                contacts, joints = evaluated_contacts(state), evaluated_joints()
                gate_pose(clip, frame, contacts, joints, stage="subframe")
                maximum_contact = max(row["separation"] for row in contacts.values() if row["contact"])
                maximum_joint = max(row["separation"] for row in joints.values())
                clip_summary["poses"] += 1
                clip_summary["maximumContactSeparation"] = max(clip_summary["maximumContactSeparation"], maximum_contact)
                clip_summary["maximumJointSeparation"] = max(clip_summary["maximumJointSeparation"], maximum_joint)
                subframe_summary["sampledPoses"] += 1
                subframe_summary["supportedContacts"] += sum(row["contact"] for row in contacts.values())
                subframe_summary["jointSamples"] += len(joints)
        subframe_summary["clips"][clip] = clip_summary
        subframe_summary["maximumContactSeparation"] = max(subframe_summary["maximumContactSeparation"], clip_summary["maximumContactSeparation"])
        subframe_summary["maximumJointSeparation"] = max(subframe_summary["maximumJointSeparation"], clip_summary["maximumJointSeparation"])
        save_gate_progress()
        track = rig.animation_data.nla_tracks.new()
        track.name = clip
        track.strips.new(clip, 0, action)
        rig.animation_data.action = None
        track.mute = True
    retained_surfaces = canonical_surfaces()
    if retained_surfaces != original_surfaces:
        raise ValueError("Canonical pilot vertices, UVs, numeric weights or source materials changed")
    if "--source-gate-only" in sys.argv:
        gate_progress["status"] = "FAIL actual source geometry" if gate_progress["failureCount"] else "PASS actual source geometry"
        result = {"status": "FAIL actual source geometry" if gate_progress["failureCount"] else
                            "PASS actual source keys/subframes, all eight limb joins and original shoulder attachment; no export/native claim",
                  "world": world, "bakeSubsteps": bake_substeps, "fps": scene.render.fps,
                  "sourceSubframes": subframe_summary, "canonicalSurfaces": retained_surfaces,
                  "sourceKeysAndSubframes": gate_progress,
                  "quaternionSignContinuity": quaternion_continuity,
                  "shoulderAttachmentObservations": shoulder_observation,
                  "torsoAttachmentPairs": torso_pairs,
                  "canonicalSurfaceEquality": True, "contactThreshold": CONTACT_TOLERANCE}
        (qa / ("source-gate-density-" + str(bake_substeps) + ".json")).write_text(json.dumps(result, indent=2) + "\n")
        print(json.dumps({key: result[key] for key in ("status", "world", "bakeSubsteps", "canonicalSurfaceEquality")}))
        if gate_progress["failureCount"]:
            raise ValueError(f"Strict source gate failed {gate_progress['failureCount']} physical samples; no model output")
        return
    scene.frame_set(1)
    # The editable source keeps all named meshes, packed materials and clips.
    editable = src / (character_id + "-spacecraft-v1.blend")
    bpy.ops.wm.save_as_mainfile(filepath=str(editable))
    # Runtime material batching preserves semantic weights and the full rig.
    material_groups = {}
    for obj in list(scene.objects):
        if obj.type == "MESH" and len(obj.data.materials) == 1:
            material_groups.setdefault(obj.data.materials[0].name, []).append(obj)
    for mat, objects in material_groups.items():
        if len(objects) < 2:
            continue
        bpy.ops.object.select_all(action="DESELECT")
        for obj in objects:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = objects[0]
        bpy.ops.object.join()
        objects[0].name = character + "Spacecraft_" + mat
    for track in rig.animation_data.nla_tracks:
        track.mute = False
    bpy.ops.object.select_all(action="DESELECT")
    rig.select_set(True)
    for obj in scene.objects:
        if obj.type == "MESH":
            obj.select_set(True)
    runtime = out / (character_id + "-spacecraft-v1.glb")
    bpy.ops.export_scene.gltf(filepath=str(runtime), export_format="GLB", use_selection=True,
                             export_skins=True, export_animations=True, export_animation_mode="NLA_TRACKS",
                             export_yup=True, export_force_sampling=True, export_frame_step=1,
                             export_frame_range=False, export_anim_slide_to_zero=True, export_materials="EXPORT")
    if runtime.stat().st_size > 6 * 1024 * 1024:
        raise ValueError("Runtime craft exceeds the current per-model library budget")
    for track in rig.animation_data.nla_tracks:
        track.mute = True
    if "--no-render" not in sys.argv:
        scene.render.engine = "CYCLES"
        scene.cycles.samples = 20
        scene.render.resolution_x = scene.render.resolution_y = 900
        scene.render.resolution_percentage = 100
        scene.world.color = (.10, .13, .20)
        for pos, power, size in [((3, 4, 6), 650, 5), ((-3, -2, 4), 450, 4)]:
            bpy.ops.object.light_add(type="AREA", location=pos)
            bpy.context.object.data.energy, bpy.context.object.data.size = power, size
        bpy.ops.object.camera_add()
        camera = bpy.context.object
        scene.camera = camera
        camera.data.type, camera.data.ortho_scale = "ORTHO", 4.3
        for name, position in [("front", (3.6, 6, 3.2)), ("chase", (3.2, -6, 3.3)), ("side", (6, -.3, 2.8))]:
            camera.location = position
            camera.rotation_euler = (Vector((0, 0, 1.05)) - camera.location).to_track_quat("-Z", "Y").to_euler()
            scene.render.filepath = str(qa / ("craft-" + name + ".png"))
            bpy.ops.render.render(write_still=True)
    report = {
        "game": "rocket-run", "version": 1, "world": world, "character": character, "ship": spec["ship"],
        "status": "EXPORTED intermediate; complete native game/graphics/action verification pending",
        "source": "artwork/games/rocket-run/build_rocket_craft.py",
        "motionSource": "artwork/games/rocket-run/rocket_flight_spec.py",
        "canonicalInput": {"path": input_relative, "sha256": input_hash,
                           "selection": "Named individual canonical pilot surfaces and original character bones only",
                           "excluded": "All kart geometry, tyre/suspension/steering bones and racing actions"},
        "identity": spec["identity"], "clips": CLIPS, "fps": LOGICAL_FPS,
        "canonicalSurfaceEquality": True, "canonicalSurfaces": retained_surfaces,
        "animationBake": {"fps": LOGICAL_FPS * bake_substeps, "substeps": bake_substeps, "logicalFps": LOGICAL_FPS,
                          "interpolation": "LINEAR", "durationUnchanged": True},
        "release": {"clip": "celebrate", "contact": "leftGrip", "startPhase": LEFT_RELEASE_START,
                    "endPhase": LEFT_RELEASE_END, "meaning": "Actual continuously lifted palm, then reattachment"},
        "semanticBones": list(rest), "contacts": REST_CONTACTS,
        "poseConversion": {"inheritScale": {"leftChain": "FULL under unit-scale ancestors", "others": "NONE under rigid unit-scale flight ancestry"}, "api": "Bone.convert_local_to_pose(invert=True)",
                           "reason": "Canonical forward left chain preserves original shoulder/elbow/wrist attachment; real supported palms/soles are separately tested against actual yoke/docks",
                           "actualContactTolerance": CONTACT_TOLERANCE,
                           "heldPalmParents": {"left": "forearm.L", "right": "flightYoke"}, "soleParents": "flightRoot",
                           "rigidLeftChain": "chest -> upperarm.L -> forearm.L -> hand.L; FULL under unit-scale ancestors",
                           "stretchedSegmentParents": "flightRoot; original rest matrices/weights unchanged"},
        "capture": {"socket": "wordCaptureSocket", "sourcePoint": CAPTURE_SOCKET,
                    "radius": CAPTURE_RADIUS, "depthRadius": .24,
                    "placement": "Align actual evaluated receiver socket with the shared world contact plane; compensate bank displacement",
                    "excludedCollision": "Decorative wings, lamps, fins and thrusters do not select printed words"},
        "actualContactSamples": actual_samples,
        "jointEndpoints": joint_pairs, "actualSourceSubframes": subframe_summary,
        "quaternionSignContinuity": quaternion_continuity,
        "torsoAttachmentPairs": torso_pairs, "shoulderAttachmentObservations": shoulder_observation,
        "editable": str(editable.relative_to(root)),
        "runtime": "/" + str(runtime.relative_to(root / "public")),
        "bytes": runtime.stat().st_size,
        "sha256": hashlib.sha256(runtime.read_bytes()).hexdigest(),
        "axes": "Runtime +Y up/-Z forward; flight origin is cockpit centre, no tyre-ground requirement",
        "ownership": "LiteracyGuide original spacecraft geometry/actions; canonical original Pal derivative, no external model/service",
        "nativeMotionReview": "UNKNOWN", "physicalDevice": "UNKNOWN",
    }
    (src / (character_id + "-spacecraft-v1.json")).write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({k: report[k] for k in ["world", "character", "ship", "bytes", "sha256", "status"]}))


if __name__ == "__main__":
    main()
