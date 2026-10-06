"""Source-only admission of the complete original route delivery.

This has no import-time I/O. The still-frozen runtime compiler will call it
after all seven sculpted views and their genuine lossless derivatives exist.
It supplies no proxy art and never changes a motor radius or source anchor.
"""
import base64
import copy
import hashlib
import json
import math

from rocket_route_spec import ROUTE_ROLES, checked_render_provenance


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def checked_runtime_route(root, world):
    source = root / 'source-art/arcade/rocket-run/route-kit-v1' / world
    registration_path = source / 'registration.json'
    registration = json.loads(registration_path.read_text())
    delivery_path = source / 'delivery.json'
    delivery = json.loads(delivery_path.read_text())
    if (registration.get('world') != world or delivery.get('world') != world
            or registration.get('trueAlpha') is not True or registration.get('completeRoleBank') is not True
            or len(registration.get('roles', [])) != len(ROUTE_ROLES)
            or {row.get('role') for row in registration['roles']} != set(ROUTE_ROLES)):
        raise ValueError('The entire actual original world/role bank is required')
    if digest(root / registration['source']) != registration['sourceSha256']:
        raise ValueError('The original sculpted route source changed')
    for source in checked_render_provenance(registration):
        if digest(root/source['path']) != source['sha256']:
            raise ValueError('The actual role-specific authoring source changed')
    original_rows = {row['role']: row for row in registration['roles']}
    primary, embedded = delivery['primary'], delivery['embedded']
    expected_url = '/game-assets/rocket-run/route-kit/' + world + '-route-kit-v1.webp'
    if primary.get('runtime') != expected_url or embedded.get('fileRuntime') != expected_url:
        raise ValueError('The exact owned world route derivative is required')
    path = root / 'public' / expected_url.lstrip('/')
    if (digest(path) != primary['runtimeSha256'] or path.stat().st_size != primary['runtimeBytes']
            or primary['runtimeSha256'] != embedded['runtimeSha256']):
        raise ValueError('The current original route derivative changed')
    prefix = 'data:image/webp;base64,'
    inline = embedded.get('runtime', '')
    if not inline.startswith(prefix) or base64.b64decode(inline[len(prefix):], validate=True) != path.read_bytes():
        raise ValueError('The independent inline route must contain the same original pixels')
    if embedded.get('inlineBytes') != len(inline.encode('ascii')):
        raise ValueError('The actual inline route delivery cost is inconsistent')
    for bank in (primary, embedded):
        if (bank.get('trueAlpha') is not True or set(bank.get('roles', {})) != set(ROUTE_ROLES)
                or any(isinstance(bank.get(key), bool) or not isinstance(bank.get(key), int)
                       or bank[key] <= 0 for key in ('width', 'height'))
                or bank.get('decodedBaseBytes') != bank['width'] * bank['height'] * 4
                or bank.get('runtimeBytes') != path.stat().st_size
                or bank.get('pixelParity', {}).get('changedAlphaPixels') != 0
                or bank.get('pixelParity', {}).get('changedVisibleRgbPixels') != 0
                or bank.get('pixelParity', {}).get('transparentRgbDifferences') != 0
                or bank.get('pixelParity', {}).get('resized') is not False
                or bank.get('pixelParity', {}).get('repainted') is not False):
            raise ValueError('Complete true-alpha original-pixel route delivery is required')
        cells = []
        for role in ROUTE_ROLES:
            row, original = bank['roles'][role], original_rows[role]
            if (row.get('source') != original.get('source') or row.get('sourceSha256') != original.get('sha256')
                    or digest(root / row['source']) != row['sourceSha256']
                    or row.get('sourceSize') != original.get('size')
                    or row.get('anchor') != original.get('anchor')
                    or row.get('pixelsPerUnit') != original.get('pixelsPerUnit')
                    or row.get('motorCore') != original.get('motorCore')
                    or any(row.get(key) != original.get(key) for key in ('renderSource', 'renderMode', 'retention'))):
                raise ValueError('Actual evaluated role size, core, pixels or anchor changed: ' + role)
            cell, anchor, ppu = row['cell'], row['anchor'], row['pixelsPerUnit']
            if (len(cell) != 4 or any(isinstance(value, bool) or not isinstance(value, int) for value in cell)
                    or len(anchor) != 2 or not isinstance(ppu, (int, float)) or isinstance(ppu, bool)
                    or not math.isfinite(ppu) or ppu <= 0):
                raise ValueError('A registered original source cell is invalid')
            left, top, right, bottom = cell
            if (left < 0 or top < 0 or right > bank['width'] or bottom > bank['height']
                    or [right-left, bottom-top] != row['sourceSize']
                    or any(isinstance(value, bool) or not isinstance(value, (int, float))
                           or not math.isfinite(value) or not 0 <= value < row['sourceSize'][index]
                           for index, value in enumerate(anchor))
                    or any(min(right, old[2]) > max(left, old[0])
                           and min(bottom, old[3]) > max(top, old[1]) for old in cells)):
                raise ValueError('An original route cell is repeated, clipped or moved')
            cells.append(cell)
            if role in ('courier', 'asteroid'):
                core = row.get('motorCore') or {}
                radius = core.get('radius')
                if (not isinstance(radius, (int, float)) or isinstance(radius, bool) or not math.isfinite(radius)
                        or radius <= 0 or core.get('sourcePoint') != [0, 0, 0]):
                    raise ValueError('A real evaluated motor-core measurement is missing')
    if (primary['width'], primary['height'], primary['roles']) != (
            embedded['width'], embedded['height'], embedded['roles']):
        raise ValueError('The primary and emergency route registration must be identical')
    return copy.deepcopy({'primary': primary, 'embedded': embedded}), {
        'registration': {'path': str(registration_path.relative_to(root)), 'sha256': digest(registration_path)},
        'delivery': {'path': str(delivery_path.relative_to(root)), 'sha256': digest(delivery_path)},
        'runtimeBytes': path.stat().st_size, 'inlineBytes': embedded['inlineBytes'],
        # The selected bank owns one decoded image/texture. Inline fallback is
        # decoded only after genuine primary failure, never in parallel.
        'maximumDecodedBaseBytes': primary['decodedBaseBytes'], 'selectedTextureOwners': 1,
        'nativeReview': 'UNKNOWN', 'physicalIpad': 'UNKNOWN'}
