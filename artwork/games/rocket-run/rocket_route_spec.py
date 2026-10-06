"""Original route-kit production shapes; no import-time Blender or I/O.

The seven roles are scenery/cargo presentation, never the answer rule. The
actual carrier receiver/collision radius remains owned by motor simulation.
"""
import copy
import math
from pathlib import PurePosixPath

ROUTE_ROLES = ("station", "portal", "courier", "planet", "asteroid", "beacon", "comet")
MEADOW_REFINED_ROLES = ("station", "portal", "planet", "asteroid", "beacon", "comet")
# Original-source reflectance colours. The cream reading-carrier material is
# unchanged; timber, brass and cloth no longer share that pale material.
MEADOW_MATERIALS = {
    "timber": (.24, .105, .032), "brass": (.55, .29, .055),
    "sailcloth": (.74, .52, .19), "lampAmber": (.95, .38, .065),
}
MEADOW_GATE_CHANNEL = {"halfWidth": 4.35, "bottom": .35, "top": 3.6}
THEMED_ROUTE_MATERIALS = {
    "dino": {"fossil": (.73, .53, .29), "sandstone": (.48, .29, .14),
             "copper": (.47, .17, .045)},
    "moonwood": {"timber": (.25, .105, .035), "copper": (.49, .24, .065)},
}
ROUTE_WORLDS = {
    "meadow": {
        "station": "Millstar observatory with golden plank ribs, domed blue telescope, four sail vanes, brass rail and bunting",
        "portal": "Twin cloth-sail mill harbour pylons with braced timber joints, fitted brass bolts, amber lanterns, red bunting and planted bases around a generous empty flight channel",
        "courier": "Cream cargo pod in a blue ribbed casing, gold clasps, red pennants and twin spring-mounted blue thrusters",
        "planet": "Small garden moon with sculpted hill patches, layered cloud wisps, miniature windmills and flower islands",
        "asteroid": "Rounded pale moon rock with recessed layered craters, gold mineral seams and small blue crystal outcrops",
        "beacon": "Amber observatory lantern with brass bands on a carved timber arm and a fitted circular gear base",
        "comet": "Gold cratered comet head with blue and cream translucent tapered tail ribbons",
        "hull": (.05, .18, .32), "panel": (.93, .79, .51), "accent": (.70, .10, .065),
        "light": (.38, .78, .94), "stone": (.55, .57, .66), "leaf": (.22, .44, .24),
    },
    "dino": {
        "station": "Fossil observatory with terraced sandstone decks, visible segmented spine arches, amber glass, leaf fans and copper rail",
        "portal": "Large fossil-rib arch with fitted vertebrae, carved stone pylons and hanging amber lamps around an open channel",
        "courier": "Amber cargo egg held in teal fossil-rib casing, copper clasps, leafy fins and twin amber nozzle lights",
        "planet": "Warm fossil moon with raised sandstone mesas, fern islands, three sculpted fossil ribs and a tiny copper dome",
        "asteroid": "Warm angular space rock with visible fitted fossil imprints, layered crater rims and amber crystals",
        "beacon": "Amber orb inside a segmented fossil cage, copper plinth and two small fern fronds",
        "comet": "Amber mineral comet with teal and orange tapered tail ribbons",
        "hull": (.045, .29, .30), "panel": (.83, .57, .26), "accent": (.64, .23, .09),
        "light": (.96, .71, .27), "stone": (.49, .35, .25), "leaf": (.23, .38, .17),
    },
    "moonwood": {
        "station": "Moonwood lantern port with carved timber decks, curved copper branch supports, layered purple leaf roof and hanging gold lanterns",
        "portal": "Two twisting carved tree arms around a clear open channel, fitted copper bands, leaf garlands and small pendant lanterns",
        "courier": "Violet reading capsule held in carved leaf-wing hull, copper fasteners, green fins and twin golden lantern thrusters",
        "planet": "Violet moon with terraced woodland islands, a tiny lantern tree, sculpted mushrooms and copper crescent observatory",
        "asteroid": "Violet lunar rock with inset craters, warm copper mineral seams and small faceted gold crystals",
        "beacon": "Golden hanging lantern with a copper frame, carved curled-branch bracket and purple leaf canopy",
        "comet": "Golden crescent comet head with layered violet and warm-gold tapered ribbons",
        "hull": (.19, .12, .31), "panel": (.62, .40, .22), "accent": (.27, .43, .16),
        "light": (.98, .78, .34), "stone": (.32, .25, .41), "leaf": (.28, .36, .20),
    },
}

ROUTE_LAYOUT_AUTHORITY = "src/utils/rocketRunRouteLayout.js"


def radial_sail_rotation(angle):
    """Orient the cloth's long Z axis along its radial X/Z rotor arm."""
    if isinstance(angle, bool) or not isinstance(angle, (int, float)) or not math.isfinite(angle):
        raise ValueError('A finite actual rotor angle is required')
    return math.pi/2-angle


def portal_frame_connections(side):
    """Physical post/riser/knee positions, shared by source and connection gates.

    The riser overlaps the original post and overhead beam; each knee end is
    inside the timber it supports. Dressing cannot replace these connections.
    """
    if isinstance(side, bool) or side not in (-1, 1):
        raise ValueError('A named actual left/right gate support is required')
    return {'riserCentre': (side*5.6, 0, 4.14), 'riserSize': (.44, .52, .96),
            'kneeEndpoints': ((side*5.6, .03, 3.80), (side*4.7, .03, 4.64)),
            'kneeRadius': .055}


def extended_support_path(points, overlap=.06):
    """Extend capped source tubes beyond their real shared joint centres.

    An endpoint at the cap alone does not establish a connected solid. The
    original shared point lies inside both adjoining supports after this
    extension; the Blender gate tests that same point on evaluated meshes.
    """
    if (len(points) < 2 or isinstance(overlap, bool) or not math.isfinite(overlap)
            or overlap <= 0 or any(len(p) != 3 or any(not math.isfinite(v) for v in p) for p in points)):
        raise ValueError('A finite, non-degenerate connected source path is required')
    result = [tuple(point) for point in points]
    for index, neighbour in ((0, 1), (-1, -2)):
        delta = [result[index][axis]-result[neighbour][axis] for axis in range(3)]
        length = math.sqrt(sum(value*value for value in delta))
        if length <= 1e-10:
            raise ValueError('Repeated tube endpoints cannot form a real support')
        result[index] = tuple(result[index][axis]+delta[axis]*overlap/length for axis in range(3))
    return result


def fossil_portal_structure():
    """One continuous fossil rib tied to both actual vertebra columns.

    Low side sections are split before entering the overhead span, allowing
    the actual evaluated-mesh channel check to inspect each physical piece.
    These are source supports, not motor collider or word-choice geometry.
    """
    columns = {side: [(side*(5.6-.9*math.sin(n*math.pi/14)), 0, .3+n*.47)
                      for n in range(8)] for side in (-1, 1)}
    overhead = [columns[-1][-1], (-4.575, 0, 3.82), (-4.45, 0, 4.05),
                (-3.3, 0, 4.62), (0, 0, 5.02), (3.3, 0, 4.62),
                (4.45, 0, 4.05), (4.575, 0, 3.82), columns[1][-1]]
    return {'columns': columns, 'columnRadius': .16,
            'overhead': overhead, 'overheadRadius': .145,
            'segmentScale': (.20, .27, .22), 'overlap': .06}


def fossil_station_structure():
    """Segmented roof bones sit on a real rib and supported stone footings."""
    rib = [(math.cos(n*math.pi/24)*1.82, .22, 1.3+math.sin(n*math.pi/24)*2.12)
           for n in range(25)]
    return {'rib': rib, 'ribRadius': .15,
            'footingSize': (.46, .46, .96), 'footingZ': .86}


def themed_lamp_support(world, side):
    """Actual branch/fossil attachment through the lamp's solid metal cap."""
    if isinstance(side, bool) or side not in (-1, 1) or world not in ('dino', 'moonwood'):
        raise ValueError('A real themed lamp and named left/right support are required')
    source = (fossil_portal_structure()['columns'][side][6] if world == 'dino'
              else (side*5.3, 0, 3.4))
    return [source, (side*4.9, -.12, 3.4), (side*4.9, -.12, 2.8+.33*.8)]


def validate_route_spec():
    """The current authored inventory cannot silently omit a world or role."""
    for world, record in ROUTE_WORLDS.items():
        if any(not isinstance(record.get(role), str) or len(record[role]) < 30 for role in ROUTE_ROLES):
            raise ValueError("Each world needs a concrete original production role: " + world)
        for key in ("hull", "panel", "accent", "light", "stone", "leaf"):
            if len(record[key]) != 3 or any(not 0 <= value <= 1 for value in record[key]):
                raise ValueError("Invalid original route material: " + world)
    if len(ROUTE_WORLDS) != 3:
        raise ValueError("All three distinct authored worlds are required")
    return True


def checked_role_camera(reference, world, role, size):
    """Preserve the actual original projection, not a fitted replacement.

    This pure reader supplies no pose or guessed pixels. A changed world,
    repeated role, moved anchor, invalid physical core or different canvas
    cannot silently become the reference for a source refinement.
    """
    rows = reference.get('roles', [])
    if (reference.get('world') != world or reference.get('completeRoleBank') is not True
            or reference.get('trueAlpha') is not True or role not in ROUTE_ROLES
            or len(rows) != len(ROUTE_ROLES) or {row.get('role') for row in rows} != set(ROUTE_ROLES)):
        raise ValueError('The complete actual world/role reference is required')
    row = next(value for value in rows if value['role'] == role)
    camera = row.get('camera') or {}
    points = [row.get('anchor'), camera.get('location'), camera.get('focus')]
    if (row.get('size') != [size, size]
            or any(not isinstance(point, list) or len(point) != (2 if index == 0 else 3)
                   or any(isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v)
                          for v in point) for index, point in enumerate(points))
            or any(not 0 <= v < size for v in points[0])):
        raise ValueError('The actual reference origin/canvas is invalid')
    scale, ppu = camera.get('orthoScale'), row.get('pixelsPerUnit')
    if (any(isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) or v <= 0
            for v in (scale, ppu)) or abs(size / scale - ppu) > 1e-10):
        raise ValueError('The actual reference projection scale changed')
    if role in ('courier', 'asteroid'):
        core = row.get('motorCore') or {}
        radius = core.get('radius')
        if (core.get('sourcePoint') != [0, 0, 0] or isinstance(radius, bool)
                or not isinstance(radius, (int, float)) or not math.isfinite(radius) or radius <= 0):
            raise ValueError('The actual original physical core reference is missing')
    return copy.deepcopy(row)


def checked_render_provenance(record):
    """Validate actual per-role source ownership for a selectively rerendered bank.

    Older single-source records have no additional ownership declaration. A
    new multi-source record must explicitly distinguish retained pixels from
    actual new renders; no path can silently inherit the current Blend hash.
    File bytes are checked by the encoder/admission caller.
    """
    if 'renderSources' not in record:
        return []
    sources = record['renderSources']
    world = record.get('world')
    prefix = PurePosixPath('source-art/arcade/rocket-run/route-kit-v1') / str(world)

    def valid(source):
        path, sha = source.get('path'), source.get('sha256')
        return (isinstance(path, str) and not PurePosixPath(path).is_absolute()
                and '..' not in PurePosixPath(path).parts
                and PurePosixPath(path).parent == prefix
                and PurePosixPath(path).suffix == '.blend'
                and isinstance(sha, str) and len(sha) == 64
                and all(c in '0123456789abcdef' for c in sha))

    if (world not in ROUTE_WORLDS or not isinstance(sources, list) or not sources
            or any(not isinstance(source, dict) or not valid(source) for source in sources)
            or len({source['path'] for source in sources}) != len(sources)):
        raise ValueError('Each actual role source needs a distinct owned Blend path/hash')
    current = {'path': record.get('source'), 'sha256': record.get('sourceSha256')}
    if current not in sources:
        raise ValueError('The current authoring source is not declared')
    rendered, retained = [], []
    for row in record.get('roles', []):
        source, mode = row.get('renderSource'), row.get('renderMode')
        if source not in sources or row.get('role') not in ROUTE_ROLES:
            raise ValueError('An actual role has no matched source ownership')
        if mode == 'retained-original-pixels':
            receipt = row.get('retention') or {}
            sha = receipt.get('originalRegistrationSha256')
            if (source == current or not isinstance(sha, str) or len(sha) != 64
                    or any(c not in '0123456789abcdef' for c in sha)):
                raise ValueError('Retained pixels require their separate original source and registration hash')
            retained.append(row['role'])
        elif mode in ('rendered-original-source', 'rendered-from-refined-source') and source == current:
            rendered.append(row['role'])
        else:
            raise ValueError('A role cannot claim a new render from a different source')
    if (sorted(record.get('renderedRoles', [])) != sorted(rendered)
            or sorted(record.get('retainedRoles', [])) != sorted(retained)):
        raise ValueError('Actual rendered and retained role inventories do not match')
    return copy.deepcopy(sources)
