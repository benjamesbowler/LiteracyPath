"""Registered true-alpha flight views from Rocket's original editable craft.

Prepared production source; run only under the explicit serialized export
lease, after build_rocket_craft.py has delivered and the first native craft
has been reviewed. No input racing geometry/action is loaded by this script.

Blender --background --python render_rocket_craft_actions.py -- ROOT
    --world meadow [--size 256] [--clips cruise,celebrate]
"""
import hashlib
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from rocket_flight_spec import CLIPS, WORLDS, CAPTURE_SOCKET, apply_bank, flight_state, baked_frame  # noqa: E402

POSE_COUNT = 6


def selected_clips(value=None):
    """A bounded render batch never changes the complete seven-action bank."""
    if value is None:
        return tuple(CLIPS)
    chosen = tuple(value.split(","))
    if not chosen or len(set(chosen)) != len(chosen) or any(clip not in CLIPS for clip in chosen):
        raise ValueError("Select distinct actual authored clips for this finite batch")
    return tuple(clip for clip in CLIPS if clip in chosen)


def retained_frames(registration, source_hash, camera, size):
    """Only same-source/same-camera views may survive a later finite batch.

    The caller separately verifies every referenced PNG hash. Old renders are
    not silently mixed with a repaired model or a changed projection.
    """
    if not registration:
        return []
    if (registration.get("craftSourceSha256") != source_hash
            or registration.get("camera") != camera
            or registration.get("size") != [size * POSE_COUNT, size * len(CLIPS)]):
        raise ValueError("Retained source views differ in craft or common camera")
    seen = set()
    for row in registration.get("frames", []):
        key = (row.get("clip"), row.get("frame"))
        if (key[0] not in CLIPS or key[1] not in sampled_frames(CLIPS[key[0]])
                or key in seen):
            raise ValueError("Retained registration has an unknown or duplicate real pose")
        seen.add(key)
    return list(registration.get("frames", []))


def sampled_frames(end):
    """Six actual integer authored frames, including rest and both endpoints."""
    if not isinstance(end, int) or end < POSE_COUNT:
        raise ValueError("An original clip needs at least six actual frames")
    return tuple(1 + round(index * (end - 1) / (POSE_COUNT - 1)) for index in range(POSE_COUNT))


def frame_cell(row, column, size):
    if not isinstance(size, int) or size < 128 or size > 512:
        raise ValueError("The authored cell must be 128..512 pixels")
    return [column * size, row * size, size, size]


def argument(name, default=None):
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    return args[args.index(name) + 1] if name in args else default


def main():
    import bpy
    from bpy_extras.object_utils import world_to_camera_view
    from mathutils import Vector

    args = sys.argv[sys.argv.index("--") + 1:]
    root = Path(args[0]).resolve()
    world = argument("--world", "meadow")
    batch = selected_clips(argument("--clips"))
    size = int(argument("--size", 256))
    frame_cell(0, 0, size)
    spec = WORLDS[world]
    source_dir = root / "source-art/arcade/rocket-run"
    craft_source = source_dir / (spec["characterId"] + "-spacecraft-v1.blend")
    craft_record = json.loads((source_dir / (spec["characterId"] + "-spacecraft-v1.json")).read_text())
    if craft_record["world"] != world or craft_record["clips"] != CLIPS:
        raise ValueError("The exact original spacecraft/action record is required")
    if craft_record["canonicalInput"]["sha256"] != spec["inputSha256"]:
        raise ValueError("The recorded canonical pilot authority changed")
    substeps = craft_record.get("animationBake", {}).get("substeps", 1)
    bpy.ops.wm.open_mainfile(filepath=str(craft_source))
    scene = bpy.context.scene
    rig = bpy.data.objects.get(spec["character"] + "FlightRig")
    if not rig or not rig.animation_data:
        raise ValueError("The original flight rig and its seven authored clips are required")
    tracks = {track.name: track for track in rig.animation_data.nla_tracks}
    if set(tracks) != set(CLIPS):
        raise ValueError("The action bank may contain only the seven authored flight clips")
    for track in tracks.values():
        track.mute = True
    motions = {name: track.strips[0].action for name, track in tracks.items()}
    model_meshes = [obj for obj in scene.objects if obj.type == "MESH"]
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 16
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.resolution_x = scene.render.resolution_y = size
    scene.render.resolution_percentage = 100
    scene.world.color = (.10, .13, .20)
    for location, energy, area_size in [((3, 4, 6), 650, 5), ((-3, -2, 4), 450, 4)]:
        bpy.ops.object.light_add(type="AREA", location=location)
        light = bpy.context.object
        light.data.energy = energy
        light.data.size = area_size
    bpy.ops.object.camera_add()
    camera = bpy.context.object
    scene.camera = camera
    camera.data.type = "ORTHO"
    camera.location = (3.2, -6, 3.3)
    focus = Vector((0, 0, 1.05))
    camera.rotation_euler = (focus - camera.location).to_track_quat("-Z", "Y").to_euler()

    def world_bounds():
        dependency = bpy.context.evaluated_depsgraph_get()
        for obj in model_meshes:
            evaluated = obj.evaluated_get(dependency)
            for corner in evaluated.bound_box:
                yield evaluated.matrix_world @ Vector(corner)

    # A common camera fits the actual evaluated craft for every selected pose,
    # rather than shrinking only its idle nominal height. No pose is cropped.
    camera.data.ortho_scale = 1
    required_scale = 1.
    for clip, end in CLIPS.items():
        rig.animation_data.action = motions[clip]
        for frame in sampled_frames(end):
            scene.frame_set(baked_frame(frame, substeps))
            bpy.context.view_layer.update()
            for point in world_bounds():
                projected = world_to_camera_view(scene, camera, point)
                required_scale = max(required_scale, 2 * abs(projected.x - .5), 2 * abs(projected.y - .5))
    camera.data.ortho_scale = required_scale * 1.12
    pixels_per_unit = size / camera.data.ortho_scale
    output = source_dir / "flight-actions-v1" / world
    output.mkdir(parents=True, exist_ok=True)
    source_hash = hashlib.sha256(craft_source.read_bytes()).hexdigest()
    camera_record = {"type": "orthographic", "location": list(camera.location),
                     "focus": list(focus), "orthoScale": camera.data.ortho_scale}
    registration_path = output / "registration.json"
    prior = json.loads(registration_path.read_text()) if registration_path.exists() else None
    previous = retained_frames(prior, source_hash, camera_record, size)
    for row in previous:
        actual = root / row["source"]
        if not actual.is_file() or hashlib.sha256(actual.read_bytes()).hexdigest() != row["sha256"]:
            raise ValueError("A retained actual rendered PNG changed")
    contact_index = {(sample["clip"], sample["frame"]): sample
                     for sample in craft_record["actualContactSamples"]}
    frames = [row for row in previous if row["clip"] not in batch]

    def pixel(point):
        projected = world_to_camera_view(scene, camera, Vector(point))
        return [projected.x * size, (1 - projected.y) * size]

    for row, (clip, end) in enumerate(CLIPS.items()):
        if clip not in batch:
            continue
        rig.animation_data.action = motions[clip]
        for column, frame in enumerate(sampled_frames(end)):
            scene.frame_set(baked_frame(frame, substeps))
            bpy.context.view_layer.update()
            sample = contact_index[(clip, frame)]
            sockets = {}
            for name, contact in sample["contacts"].items():
                sockets[name] = {"pixel": pixel(contact["point"]),
                                 "supportPixel": pixel(contact["support"]),
                                 "contact": contact["contact"],
                                 "separation": contact["separation"],
                                 "sourceSurfacePoint": contact["sourceSurfacePoint"],
                                 "sourceBone": contact["sourceBone"]}
            filename = f"{clip}-{frame:03}.png"
            scene.render.filepath = str(output / filename)
            scene.cycles.seed = row * 1000 + frame
            bpy.ops.render.render(write_still=True)
            image_bytes = (output / filename).read_bytes()
            phase = (frame - 1) / (end - 1)
            capture = apply_bank(CAPTURE_SOCKET, flight_state(clip, phase))
            frames.append({"clip": clip, "frame": frame, "phase": phase,
                           "cell": frame_cell(row, column, size), "anchor": pixel(capture),
                           "originPixel": pixel((0, 0, 0)), "capturePixel": pixel(capture),
                           "pixelsPerUnit": pixels_per_unit, "sockets": sockets,
                           "source": str((output / filename).relative_to(root)),
                           "sha256": hashlib.sha256(image_bytes).hexdigest(),
                           "sourceSize": [size, size]})
            print(json.dumps({"rendered": filename, "world": world, "batch": batch}), flush=True)
    rig.animation_data.action = None
    frames.sort(key=lambda row: (list(CLIPS).index(row["clip"]), row["frame"]))
    complete = len(frames) == POSE_COUNT * len(CLIPS)
    manifest = {
        "game": "rocket-run", "world": world, "character": spec["character"],
        "status": ("RENDERED complete source bank; encoding/alpha/contact/native fallback acceptance pending" if complete
                   else "INTERMEDIATE partial finite render batch; no complete bank or native acceptance"),
        "completeSourceBank": complete, "lastRenderBatch": list(batch),
        "creator": "LiteracyGuide original spacecraft/actions and retained canonical Pal",
        "craftSource": str(craft_source.relative_to(root)),
        "craftSourceSha256": source_hash,
        "generator": "artwork/games/rocket-run/render_rocket_craft_actions.py",
        "size": [size * POSE_COUNT, size * len(CLIPS)], "nominalHeight": camera.data.ortho_scale,
        "camera": camera_record,
        "frames": frames, "trueAlpha": True,
        "contactAuthority": "Original actual skinned palm/sole and physical yoke/dock samples; finale releases left grip",
        "decodedCostBytes": size * size * POSE_COUNT * len(CLIPS) * 4,
        "nativeFallback": "UNKNOWN", "humanReview": "UNKNOWN", "physicalIpad": "UNKNOWN",
    }
    registration_path.write_text(json.dumps(manifest, indent=2) + "\n")
    print(json.dumps({"world": world, "frames": len(frames), "size": manifest["size"],
                      "decodedCostBytes": manifest["decodedCostBytes"], "status": manifest["status"]}))


if __name__ == "__main__":
    main()
