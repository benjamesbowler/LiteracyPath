"""Compile original evaluated flight views without repainting or resizing.

Prepared source only. Invoke under an explicit CPU encoder lease after the
editable spacecraft and its 42 actual source views have been delivered. This
module has no import-time image, Blender, filesystem mutation or export work.
"""
import argparse
import base64
import hashlib
import json
import math
from pathlib import Path

from rocket_flight_spec import CLIPS
from render_rocket_craft_actions import sampled_frames


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def runtime_frame(record, image_size):
    """Convert raw XYWH cells into the shared helper's LTRB/absolute sockets."""
    left, top, width, height = record["cell"]
    if image_size != (width, height):
        raise ValueError("The actual source image does not match its cell")
    if any(not isinstance(value, int) or isinstance(value, bool) for value in record["cell"]):
        raise ValueError("Source cells require exact integer pixel coordinates")
    if min(left, top) < 0 or min(width, height) <= 0:
        raise ValueError("Invalid registered source cell")
    anchor = record["capturePixel"]
    if any(not 0 <= value < limit for value, limit in zip(anchor, image_size)):
        raise ValueError("The physical capture-ring centre is outside the view")
    sockets = {"captureCenter": [left + anchor[0], top + anchor[1]]}
    contacts = {}
    for name, source in record["sockets"].items():
        point = source["pixel"]
        if any(not 0 <= value < limit for value, limit in zip(point, image_size)):
            raise ValueError(f"Actual {name} surface projection is outside the view")
        support = source["supportPixel"]
        if any(not 0 <= value < limit for value, limit in zip(support, image_size)):
            raise ValueError(f"Actual {name} support projection is outside the view")
        sockets[name] = [left + point[0], top + point[1]]
        contacts[name] = {**source, "pixel": sockets[name],
                          "supportPixel": [left + source["supportPixel"][0],
                                           top + source["supportPixel"][1]]}
    return {"clip": record["clip"], "frame": record["frame"],
            "phase": record["phase"], "cell": [left, top, left + width, top + height],
            "anchor": list(anchor), "anchorMeaning": "transparent physical capture-ring centre",
            "sockets": sockets, "contacts": contacts,
            "source": record["source"], "sourceSha256": record["sha256"],
            "sourceSize": list(image_size), "originPixel": record["originPixel"]}


def validate_source_views(frames):
    """Reject a nominal42-cell sheet missing actual poses of any one action."""
    if len(frames) != 42 or {row["clip"] for row in frames} != set(CLIPS):
        raise ValueError("All seven original clips and six actual views per clip are required")
    for clip, end in CLIPS.items():
        rows = [row for row in frames if row["clip"] == clip]
        expected = set(sampled_frames(end))
        if len(rows) != 6 or {row["frame"] for row in rows} != expected:
            raise ValueError(f"The actual six registered {clip} views are incomplete or repeated")
        for row in rows:
            phase = row["phase"]
            if not math.isfinite(phase) or abs(phase - (row["frame"] - 1) / (end - 1)) > 1e-9:
                raise ValueError("A registered pose phase disagrees with its actual authored frame")


def verify_alpha_and_pixels(source, delivered):
    """Every alpha byte and every visible source colour must remain exact."""
    if source.size != delivered.size:
        raise ValueError("Encoded delivery dimensions changed")
    before, after = source.tobytes(), delivered.tobytes()
    changed_alpha = changed_visible = transparent_rgb = 0
    for index in range(0, len(before), 4):
        changed_alpha += before[index + 3] != after[index + 3]
        if before[index + 3]:
            changed_visible += before[index:index + 3] != after[index:index + 3]
        else:
            transparent_rgb += before[index:index + 3] != after[index:index + 3]
    if changed_alpha or changed_visible:
        raise ValueError("Lossless delivery changed original visible pixels or alpha")
    return {"changedAlphaPixels": changed_alpha, "changedVisibleRgbPixels": changed_visible,
            "transparentRgbDifferences": transparent_rgb, "resized": False, "repainted": False}


def compile_world(root, world):
    from PIL import Image

    source_dir = root / "source-art/arcade/rocket-run/flight-actions-v1" / world
    registration_path = source_dir / "registration.json"
    registration = json.loads(registration_path.read_text())
    if registration["world"] != world or registration.get("trueAlpha") is not True:
        raise ValueError("The exact true-alpha original world registration is required")
    width, height = registration["size"]
    atlas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    runtime_frames, views, cells = [], [], []
    validate_source_views(registration["frames"])
    ppu = {row["pixelsPerUnit"] for row in registration["frames"]}
    if len(ppu) != 1 or next(iter(ppu)) <= 0:
        raise ValueError("Every view must use the same measured camera scale")
    for record in registration["frames"]:
        source = root / record["source"]
        if digest(source) != record["sha256"]:
            raise ValueError("An original evaluated flight view changed")
        with Image.open(source) as original:
            image = original.convert("RGBA")
        frame = runtime_frame(record, image.size)
        left, top, right, bottom = frame["cell"]
        if right > width or bottom > height or any(
                min(right, old[2]) > max(left, old[0]) and min(bottom, old[3]) > max(top, old[1])
                for old in cells):
            raise ValueError("Registered original cells overlap or leave the atlas")
        cells.append(frame["cell"])
        alpha = image.getchannel("A")
        bounds = alpha.getbbox()
        if not bounds or bounds[0] < 2 or bounds[1] < 2 or bounds[2] > image.width - 2 or bounds[3] > image.height - 2:
            raise ValueError("A real craft pose is empty or clipped at the source edge")
        frame["bounds"] = list(bounds)
        frame["visibleContactPixels"] = {
            name: {"alpha": image.getpixel((round(socket["pixel"][0]), round(socket["pixel"][1])))[3],
                   "physicalContact": socket["contact"], "physicalSeparation": socket["separation"]}
            for name, socket in record["sockets"].items()
        }
        # The receiver centre is intentionally open; its alpha is neither an
        # anatomy gate nor a reason to shift a socket or paint fake contact.
        atlas.paste(image, (left, top))
        runtime_frames.append(frame)
        views.append(image)
    runtime_dir = root / "public/game-assets/rocket-run/flight-actions"
    runtime_dir.mkdir(parents=True, exist_ok=True)
    path = runtime_dir / f"{world}-flight-actions-v1.webp"
    atlas.save(path, format="WEBP", lossless=True, exact=True, method=4)
    with Image.open(path) as decoded:
        parity = verify_alpha_and_pixels(atlas, decoded.convert("RGBA"))
    first_index = next(index for index, row in enumerate(runtime_frames) if row["clip"] == "cruise" and row["phase"] == 0)
    idle = views[first_index]
    idle_path = runtime_dir / f"{world}-flight-idle-v1.webp"
    idle.save(idle_path, format="WEBP", lossless=True, exact=True, method=4)
    with Image.open(idle_path) as decoded:
        idle_parity = verify_alpha_and_pixels(idle, decoded.convert("RGBA"))
    first = runtime_frames[first_index]
    x, y, _, _ = first["cell"]
    idle_frame = {**first, "cell": [0, 0, idle.width, idle.height],
                  "sockets": {name: [point[0] - x, point[1] - y] for name, point in first["sockets"].items()},
                  "contacts": {name: {**contact, "pixel": [contact["pixel"][0] - x, contact["pixel"][1] - y],
                                      "supportPixel": [contact["supportPixel"][0] - x, contact["supportPixel"][1] - y]}
                               for name, contact in first["contacts"].items()}}
    # Three original phase views per clip remain available when both external
    # action and idle requests fail. This is a registered retained-image bank,
    # not a drawn proxy pilot. Every copied visible/alpha byte stays exact.
    cell_size = idle.width
    emergency_image = Image.new("RGBA", (cell_size * 3, cell_size * len(CLIPS)), (0, 0, 0, 0))
    emergency_frames = []
    for row_index, clip in enumerate(CLIPS):
        indices = [index for index, frame in enumerate(runtime_frames) if frame["clip"] == clip]
        chosen = [indices[0], min(indices, key=lambda index: abs(runtime_frames[index]["phase"] - .4)), indices[-1]]
        if len(set(chosen)) != 3:
            raise ValueError("The emergency action requires three distinct original phases")
        for column, index in enumerate(chosen):
            frame = runtime_frames[index]
            old_x, old_y, old_right, old_bottom = frame["cell"]
            x, y = column * cell_size, row_index * cell_size
            dx, dy = x - old_x, y - old_y
            emergency_image.paste(views[index], (x, y))
            emergency_frames.append({**frame, "cell": [x, y, x + old_right - old_x, y + old_bottom - old_y],
                                     "sockets": {name: [point[0] + dx, point[1] + dy]
                                                 for name, point in frame["sockets"].items()},
                                     "contacts": {name: {**contact,
                                                          "pixel": [contact["pixel"][0] + dx, contact["pixel"][1] + dy],
                                                          "supportPixel": [contact["supportPixel"][0] + dx,
                                                                           contact["supportPixel"][1] + dy]}
                                                  for name, contact in frame["contacts"].items()}})
    emergency_path = runtime_dir / f"{world}-flight-emergency-v1.webp"
    emergency_image.save(emergency_path, format="WEBP", lossless=True, exact=True, method=4)
    with Image.open(emergency_path) as decoded:
        emergency_parity = verify_alpha_and_pixels(emergency_image, decoded.convert("RGBA"))
    shared = {"pixelsPerUnit": next(iter(ppu)), "nominalHeight": registration["nominalHeight"],
              "creator": "LiteracyGuide original spacecraft/flight actions and retained canonical Pal",
              "registration": str(registration_path.relative_to(root)),
              "registrationSha256": digest(registration_path), "world": world}
    def delivery(image_path, size, frames, proof):
        return {**shared, "runtime": "/" + str(image_path.relative_to(root / "public")),
                "runtimeSha256": digest(image_path), "runtimeBytes": image_path.stat().st_size,
                "width": size[0], "height": size[1], "decodedBaseBytes": size[0] * size[1] * 4,
                "frames": frames, "pixelParity": proof}
    emergency_runtime = "data:image/webp;base64," + base64.b64encode(emergency_path.read_bytes()).decode("ascii")
    result = {"status": "ENCODED original pixels; actual contacts/native scene/review pending",
              "primary": delivery(path, atlas.size, runtime_frames, parity),
              "independentIdle": delivery(idle_path, idle.size, [idle_frame], idle_parity),
              "emergency": {**delivery(emergency_path, emergency_image.size, emergency_frames, emergency_parity),
                            "fileRuntime": "/" + str(emergency_path.relative_to(root / "public")),
                            "runtime": emergency_runtime,
                            "deliveryPolicy": "Inline original-pixel action bank, independent of external image requests",
                            "inlineBytes": len(emergency_runtime.encode("ascii"))},
              "nativeFallback": "UNKNOWN", "humanReview": "UNKNOWN", "physicalIpad": "UNKNOWN"}
    (source_dir / "delivery.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({"world": world, "status": result["status"], "views": len(runtime_frames),
                      "runtimeBytes": path.stat().st_size + idle_path.stat().st_size + emergency_path.stat().st_size,
                      "inlineBytes": result["emergency"]["inlineBytes"],
                      "decodedBaseBytes": width * height * 4 + idle.width * idle.height * 4
                      + emergency_image.width * emergency_image.height * 4}))
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("root", type=Path)
    parser.add_argument("--world", choices=["meadow", "dino", "moonwood"], required=True)
    args = parser.parse_args()
    compile_world(args.root.resolve(), args.world)


if __name__ == "__main__":
    main()
