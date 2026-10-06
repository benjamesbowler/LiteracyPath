"""Read-only actual editable-source diagnosis; no render or export.

Blender --background --python-exit-code 1 --python THIS -- BLEND JSON REPORT
The old source is sampled with its own recorded release/timing contract, not
the new recipe's intended curves. Inputs are fingerprinted before and after.
"""
import hashlib
import json
import math
import sys
from pathlib import Path


def fingerprint(path):
    return {"path": str(path), "bytes": path.stat().st_size,
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}


def main():
    import bpy
    from mathutils import Vector

    args = sys.argv[sys.argv.index("--") + 1:]
    source, metadata, output = map(Path, args[:3])
    before = [fingerprint(source), fingerprint(metadata)]
    record = json.loads(metadata.read_text())
    bpy.ops.wm.open_mainfile(filepath=str(source))
    scene = bpy.context.scene
    rig = bpy.data.objects[record["character"] + "FlightRig"]
    actions = {track.name: track.strips[0].action for track in rig.animation_data.nla_tracks}
    for track in rig.animation_data.nla_tracks:
        track.mute = True
    rest = {bone.name: bone.matrix_local.copy() for bone in rig.data.bones}
    points = record["contacts"]
    release = record.get("release", {"clip": "celebrate", "contact": "leftGrip",
                                     "startPhase": .04, "endPhase": .96})
    density = record.get("animationBake", {}).get("substeps", 1)
    pairs = record.get("jointEndpoints") or {
        side.lower() + name: {"fromBone": first + "." + side, "toBone": second + "." + side,
                             "fromSourcePoint": list(rig.data.bones[first + "." + side].tail_local),
                             "toSourcePoint": list(rig.data.bones[second + "." + side].head_local)}
        for side in ("L", "R")
        for name, first, second in (("Wrist", "forearm", "hand"), ("Elbow", "upperarm", "forearm"),
                                   ("Ankle", "shin", "foot"), ("Knee", "thigh", "shin"))}
    rows, failures = [], []
    failed_samples = 0
    for clip, logical_end in record["clips"].items():
        rig.animation_data.action = actions[clip]
        end = 1 + (logical_end - 1) * density
        times = list(range(1, end + 1))
        times += [frame + fraction for frame in range(1, end) for fraction in (.123, .25, .5, .75, .876)]
        row = {"clip": clip, "poses": len(times), "maximumContactSeparation": 0,
               "maximumJointSeparation": 0, "worstContact": None, "worstJoint": None}
        for time in times:
            lower = math.floor(time)
            scene.frame_set(lower, subframe=time - lower)
            bpy.context.view_layer.update()
            phase = (time - 1) / (end - 1)
            for name, point in points.items():
                if clip == release["clip"] and name == release["contact"] and release["startPhase"] < phase < release["endPhase"]:
                    continue
                side = "L" if name.startswith("left") else "R"
                bone = ("hand." if name.endswith("Grip") else "foot.") + side
                support = name + "Socket" if name.endswith("Grip") else name.replace("Sole", "FootDock")
                skin = rig.pose.bones[bone].matrix @ rest[bone].inverted() @ Vector(point)
                surface = rig.pose.bones[support].matrix.translation
                separation = (skin - surface).length
                if separation > row["maximumContactSeparation"]:
                    row["maximumContactSeparation"] = separation
                    row["worstContact"] = {"name": name, "frame": time, "phase": phase, "separation": separation,
                                           "point": list(skin), "support": list(surface)}
                if separation > .00001:
                    failed_samples += 1
                    if len(failures) < 32:
                        failures.append({"kind": "supported-contact", "clip": clip, "frame": time,
                                         "phase": phase, "name": name, "separation": separation})
            for name, pair in pairs.items():
                evaluated = [rig.pose.bones[pair[edge + "Bone"]].matrix
                             @ rest[pair[edge + "Bone"]].inverted() @ Vector(pair[edge + "SourcePoint"])
                             for edge in ("from", "to")]
                separation = (evaluated[0] - evaluated[1]).length
                if separation > row["maximumJointSeparation"]:
                    row["maximumJointSeparation"] = separation
                    row["worstJoint"] = {"name": name, "frame": time, "phase": phase,
                                         "separation": separation, "from": list(evaluated[0]), "to": list(evaluated[1])}
                if separation > .00001:
                    failed_samples += 1
                    if len(failures) < 32:
                        failures.append({"kind": "limb-endpoint", "clip": clip, "frame": time,
                                         "phase": phase, "name": name, "separation": separation})
        rows.append(row)
        # Preserve useful completed-clip diagnosis if the enclosing finite
        # process guard ends an expensive all-subframe walk later.
        output.with_suffix(".partial.json").write_text(json.dumps({"status": "PARTIAL read-only source diagnosis, not a complete gate",
                                                                  "completedClips": rows, "before": before,
                                                                  "failedSamples": failed_samples,
                                                                  "failureExamples": failures}, indent=2) + "\n")
    after = [fingerprint(source), fingerprint(metadata)]
    result = {"status": "FAIL actual source intermediate pose drift" if failed_samples else "PASS actual source sampled subframes",
              "threshold": .00001, "before": before, "after": after, "sourceEquality": before == after,
              "failedSamples": failed_samples, "failureExamples": failures, "clips": rows,
              "note": "Read-only source evaluation; exported GLB and rendered motion are separate evidence"}
    output.write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({"status": result["status"], "failedSamples": failed_samples,
                      "maxContact": max(row["maximumContactSeparation"] for row in rows),
                      "maxJoint": max(row["maximumJointSeparation"] for row in rows), "sourceEquality": before == after}))
    if failed_samples or before != after:
        raise RuntimeError("Strict actual source subframe diagnosis failed; report retained")


if __name__ == "__main__":
    main()
