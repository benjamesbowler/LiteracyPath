"""Pure specification for Rocket Run's original spacecraft and seated contacts.

This module does not import Blender or load/modify the retained racing sources.
The Blender exporter consumes these same curves; their unit checks are source
proof only, never a claim that an exported model or native scene was reviewed.
"""
import math

WORLDS = {
    "meadow": {
        "character": "Bouncy", "characterId": "bouncy", "ship": "Millstar Express",
        "inputSha256": "af3e55c1b7bcbf9ba3919cdbac61764855fe730879142c3d13f7c134ff42bf84",
        "hull": (.055, .14, .28), "panel": (.91, .82, .62), "accent": (.68, .055, .04),
        "metal": (.56, .62, .66), "lamp": (.34, .79, .96),
        "width": .78, "length": 1.44, "podX": .92, "wingTip": 1.50,
        "identity": "Yellow wool lamb, cream face, red scarf, floppy ears, two silver coil legs and attached brown feet",
    },
    "dino": {
        "character": "Chompy", "characterId": "chompy", "ship": "Fossil Flyer",
        # Current original Dino source includes the reviewed exterior iris/pupil
        # registration correction; its rig, contacts and nonocular skin are retained.
        "inputSha256": "1b5b24f0ee714e4d571fa83edba4c6833d6b3464029a144642ebe6fa7c5865c5",
        "hull": (.025, .32, .34), "panel": (.86, .58, .20), "accent": (.72, .22, .07),
        "metal": (.54, .62, .61), "lamp": (.92, .73, .23),
        "width": .84, "length": 1.54, "podX": 1.03, "wingTip": 1.74,
        "identity": "Orange dinosaur, cream belly and bandana, rounded snout, dorsal forms, complete tail and two clawed feet",
    },
    "moonwood": {
        "character": "Pip", "characterId": "pip", "ship": "Lantern Skipper",
        "inputSha256": "5e907dc2582cd1053f4078f8ebcd33994ebfb8eec77472cb7332832106403712",
        "hull": (.13, .105, .29), "panel": (.68, .46, .22), "accent": (.24, .40, .13),
        "metal": (.63, .49, .27), "lamp": (.96, .74, .32),
        "width": .76, "length": 1.48, "podX": .91, "wingTip": 1.56,
        "identity": "Brown-haired woodland elf, pointed ears, green tunic, exposed hands and two complete brown boots",
    },
}

CLIPS = {
    "cruise": 60,
    "bank_left": 36,
    "bank_right": 36,
    "boost": 30,
    "shield_recover": 42,
    "catch": 30,
    "celebrate": 60,
}

# Logical authored timing stays at 30 fps. The editable/exported derivative
# bakes continuous limb joins more densely; real subframes remain a strict
# evaluated gate, rather than being rounded to these keys at runtime.
LOGICAL_FPS = 30
BAKE_SUBSTEPS = 1
ALLOWED_BAKE_SUBSTEPS = (1, 2, 4, 8)
BAKE_FPS = LOGICAL_FPS * BAKE_SUBSTEPS
CONTACT_TOLERANCE = .00001
LEFT_RELEASE_START = 2 / (CLIPS["celebrate"] - 1)
LEFT_RELEASE_END = (CLIPS["celebrate"] - 3) / (CLIPS["celebrate"] - 1)


def baked_frame(logical_frame, substeps=BAKE_SUBSTEPS):
    if substeps not in ALLOWED_BAKE_SUBSTEPS:
        raise ValueError("The declared finite bake density must be 1, 2, 4 or 8")
    return 1 + (logical_frame - 1) * substeps


def smoothstep(value):
    value = max(0., min(1., value))
    return value * value * (3 - 2 * value)


def left_release_weight(phase):
    # Exact logical keys bound a smooth, visible release. The hand stays on
    # its real yoke before departure and after reattachment, including between
    # keys; there is no unsupported bank/boost/catch phase.
    return (smoothstep((phase - LEFT_RELEASE_START) / .14)
            * smoothstep((LEFT_RELEASE_END - phase) / .14))


def same_quaternion_hemisphere(quaternion, previous=None):
    """Choose equivalent q/-q keys so component interpolation stays local.

    This changes no keyed orientation or authored motion. Independent clips
    pass no previous value at their first key; there is no cross-clip state.
    """
    points = (quaternion,) if previous is None else (quaternion, previous)
    if any(len(point) != 4 or not all(math.isfinite(value) for value in point)
           or sum(value * value for value in point) == 0 for point in points):
        raise ValueError("Quaternion keys must contain four finite nonzero components")
    if previous is not None and sum(previous[i] * quaternion[i] for i in range(4)) < 0:
        return tuple(-value for value in quaternion)
    return tuple(quaternion)


def anatomical_bend_frame(start, end, normal):
    """Orthonormal bone columns from the actual continuous arm bend plane.

    Unlike a rest-to-target shortest arc, the plane declares twist even when
    the new segment axis opposes the old one. It cannot silently choose a new
    roll or stretch a limb. Degenerate anatomical planes are rejected.
    """
    if not all(math.isfinite(v) for point in (start, end, normal) for v in point):
        raise ValueError("Anatomical frame inputs must be finite")
    delta = tuple(end[i] - start[i] for i in range(3))
    length = math.sqrt(sum(v*v for v in delta))
    if length < 1e-8:
        raise ValueError("Anatomical bone axis is singular")
    y = tuple(v / length for v in delta)
    dot = sum(normal[i] * y[i] for i in range(3))
    perpendicular = tuple(normal[i] - dot * y[i] for i in range(3))
    size = math.sqrt(sum(v*v for v in perpendicular))
    if size < 1e-8:
        raise ValueError("Anatomical bend plane is singular")
    x = tuple(v / size for v in perpendicular)
    z = (x[1]*y[2]-x[2]*y[1], x[2]*y[0]-x[0]*y[2], x[0]*y[1]-x[1]*y[0])
    return (x, y, z)


def rigid_elbow(shoulder, wrist, upper_length, fore_length, pole):
    """Two actual rigid lengths, with a fixed authored bend side.

    Unreachable or singular input is a production failure. This function
    never clamps the wrist, stretches anatomy, or changes the flight curve.
    """
    if not all(math.isfinite(value) for point in (shoulder, wrist, pole) for value in point):
        raise ValueError("Rigid arm points must be finite")
    if not all(math.isfinite(value) and value > 0 for value in (upper_length, fore_length)):
        raise ValueError("Rigid arm lengths must be positive")
    delta = tuple(wrist[i] - shoulder[i] for i in range(3))
    distance = math.sqrt(sum(value * value for value in delta))
    if distance <= abs(upper_length - fore_length) or distance >= upper_length + fore_length:
        raise ValueError("Authored wrist is unreachable without hyperextension")
    axis = tuple(value / distance for value in delta)
    hint = tuple(pole[i] - shoulder[i] for i in range(3))
    along = sum(hint[i] * axis[i] for i in range(3))
    bend = tuple(hint[i] - along * axis[i] for i in range(3))
    bend_length = math.sqrt(sum(value * value for value in bend))
    if bend_length < 1e-8:
        raise ValueError("The authored elbow pole is singular")
    along_arm = (upper_length * upper_length - fore_length * fore_length + distance * distance) / (2 * distance)
    height_squared = upper_length * upper_length - along_arm * along_arm
    if height_squared <= 0:
        raise ValueError("The authored arm has no stable bend")
    height = math.sqrt(height_squared)
    return tuple(shoulder[i] + along_arm * axis[i] + height * bend[i] / bend_length for i in range(3))

# These are actual surface centres in the canonical editable source, rather
# than aliases for the old steering-wheel or pedal geometry. The new yoke and
# foot docks are authored at these contacts and follow the new flight curves.
REST_CONTACTS = {
    "leftGrip": (-.232, .233, 1.018),
    "rightGrip": (.232, .233, 1.018),
    "leftSole": (-.25, .79, .298),
    "rightSole": (.25, .79, .298),
}
YOKE_PIVOT = (0, .233, 1.018)
# The physical reading receiver is a visible ring ahead of the prow. Both
# renderers align this actual socket with the simulation's contact plane; they
# must not infer a collider from the much wider decorative wings or thrusters.
CAPTURE_SOCKET = (0, 1.8, .54)
CAPTURE_RADIUS = .34
CHARACTER_BONES = (
    "hips", "chest", "neck", "head",
    "upperarm.L", "forearm.L", "hand.L", "thigh.L", "shin.L", "foot.L",
    "upperarm.R", "forearm.R", "hand.R", "thigh.R", "shin.R", "foot.R",
)


def clamp_phase(phase):
    if not math.isfinite(phase):
        raise ValueError("A flight phase must be finite")
    return max(0., min(1., phase))


def flight_state(clip, phase):
    """Registered motion curves; input interruption is a runtime concern.

    Banks/boost/catch/recovery return to their flight rest at both endpoints.
    Cruise loops. The finale waves a visibly released left arm while keeping
    the right grip and both sole supports, so it cannot claim two-hand contact.
    """
    if clip not in CLIPS:
        raise ValueError("Unknown original spacecraft clip: " + str(clip))
    t = clamp_phase(phase)
    pulse = math.sin(math.pi * t)
    bank = (-1 if clip == "bank_left" else 1 if clip == "bank_right" else 0) * .21 * pulse
    if clip == "shield_recover":
        bank = math.sin(t * math.tau * 2) * .095 * pulse * (1 - t)
    yoke_pitch = (-.045 if clip == "boost" else .055 if clip == "catch" else 0) * pulse
    yoke_y = (.024 if clip == "boost" else -.014 if clip == "bank_left" else .014 if clip == "bank_right" else 0) * pulse
    torso_x = (-.035 if clip == "bank_left" else .035 if clip == "bank_right" else 0) * pulse
    torso_y = (.031 if clip == "boost" else -.018 if clip == "catch" else 0) * pulse
    head_y = .008 * math.sin(t * math.tau) if clip == "cruise" else torso_y
    release = clip == "celebrate" and LEFT_RELEASE_START < t < LEFT_RELEASE_END
    release_weight = left_release_weight(t) if clip == "celebrate" else 0
    wave = math.sin(t * math.tau * 3) * .075 * pulse if release else 0
    return {
        "bank": bank, "yokePitch": yoke_pitch, "yokeY": yoke_y,
        "torsoX": torso_x, "torsoY": torso_y, "headY": head_y,
        "releasedLeft": release, "leftWave": wave, "leftReleaseWeight": release_weight,
        "boost": pulse if clip == "boost" else 0,
        "shield": pulse if clip == "shield_recover" else 0,
    }


def celebration_free_wrist(phase, state=None):
    """Friendly three-cycle wave beside the left cheek, within natural reach.

    This entire authored path replaces the overextended earlier derivative.
    Blending to/from the physical yoke still uses the unchanged release
    envelope. No wrist clamping or anatomical length changes occur here.
    """
    t = clamp_phase(phase)
    state = flight_state("celebrate", t) if state is None else state
    # The outward 11cm shift keeps the friendly gesture outside the visible
    # wool silhouette in the unchanged rear-quarter camera. Its whole path,
    # not per-frame clamping, remains inside the original anatomical reach.
    return (-.64 + state["leftWave"], -.45, 1.84 + .055 * math.sin(math.pi * t))


def apply_yoke(point, state):
    x, y, z = (point[i] - YOKE_PIVOT[i] for i in range(3))
    c, s = math.cos(state["yokePitch"]), math.sin(state["yokePitch"])
    return (x + YOKE_PIVOT[0], c * y - s * z + YOKE_PIVOT[1] + state["yokeY"],
            s * y + c * z + YOKE_PIVOT[2])


def apply_bank(point, state):
    """Blender +Y forward/+Z up; glTF converts this to -Z forward/+Y up."""
    x, y, z = point
    c, s = math.cos(state["bank"]), math.sin(state["bank"])
    return (c * x + s * z, y, -s * x + c * z)


def contact_targets(clip, phase):
    state = flight_state(clip, phase)
    result = {}
    for name, point in REST_CONTACTS.items():
        released = name == "leftGrip" and state["releasedLeft"]
        local = apply_yoke(point, state) if name.endswith("Grip") else point
        if released:
            wrist = celebration_free_wrist(phase, state)
            released_point = (wrist[0], wrist[1], wrist[2] + .03)
            weight = state["leftReleaseWeight"]
            local = tuple(local[i] * (1 - weight) + released_point[i] * weight for i in range(3))
        result[name] = {
            "point": apply_bank(local, state),
            "contact": not released,
            "surface": "flight-yoke" if name.endswith("Grip") else "flight-foot-dock",
        }
    return result


def semantic_source_selection(names, world):
    """Do not select material-joined GLB surfaces that include kart geometry."""
    character = WORLDS[world]["character"]
    rig = character + "KartRig"
    selected = [name for name in names if name == rig or name.startswith(character)]
    if rig not in selected or not any(name != rig for name in selected):
        raise ValueError("The editable canonical individual surfaces and rig are required")
    if any(name.startswith(character + "Kart_") for name in selected):
        raise ValueError("A material-joined runtime cart is not a canonical pilot source")
    return selected
