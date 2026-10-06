"""Lossless original-route delivery; execution requires a finite encoder slot."""
import argparse
import base64
import hashlib
import json
import math
from pathlib import Path

from compile_rocket_flight_art import verify_alpha_and_pixels
from rocket_route_spec import ROUTE_ROLES, ROUTE_WORLDS, checked_render_provenance


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def check_registration(record):
    checked_render_provenance(record)
    rows = record.get('roles', [])
    if (record.get('trueAlpha') is not True or record.get('completeRoleBank') is not True
            or len(rows) != len(ROUTE_ROLES) or {row['role'] for row in rows} != set(ROUTE_ROLES)):
        raise ValueError('All seven actual original true-alpha route views are required')
    sizes = {tuple(row['size']) for row in rows}
    if len(sizes) != 1:
        raise ValueError('Original route cells must have one declared pixel size')
    size = next(iter(sizes))
    if size[0] != size[1] or size[0] not in (256, 384, 512):
        raise ValueError('Invalid original route canvas dimensions')
    for row in rows:
        if (not math.isfinite(row['pixelsPerUnit']) or row['pixelsPerUnit'] <= 0
                or len(row['anchor']) != 2 or any(not math.isfinite(v) or not 0 <= v < size[i]
                    for i, v in enumerate(row['anchor']))):
            raise ValueError('A measured original route origin leaves the canvas')
        if row['role'] in ('courier', 'asteroid'):
            core = row.get('motorCore') or {}
            if (not isinstance(core.get('radius'), (int, float)) or not math.isfinite(core['radius'])
                    or core['radius'] <= 0 or core.get('sourcePoint') != [0, 0, 0]):
                raise ValueError('Actual evaluated cargo/hazard core registration is required')
    return size[0]


def main():
    from PIL import Image
    parser = argparse.ArgumentParser()
    parser.add_argument('root', type=Path)
    parser.add_argument('--world', choices=list(ROUTE_WORLDS), required=True)
    args = parser.parse_args()
    root, world = args.root.resolve(), args.world
    source = root / 'source-art/arcade/rocket-run/route-kit-v1' / world
    record = json.loads((source/'registration.json').read_text())
    if record['world'] != world or digest(root/record['source']) != record['sourceSha256']:
        raise ValueError('The actual original route source changed')
    size = check_registration(record)
    for source_record in checked_render_provenance(record):
        if digest(root/source_record['path']) != source_record['sha256']:
            raise ValueError('An actual current or retained role source changed')
    atlas = Image.new('RGBA', (size*4, size*2), (0, 0, 0, 0))
    roles = {}
    rows = {row['role']: row for row in record['roles']}
    for index, role in enumerate(ROUTE_ROLES):
        row = rows[role]
        path = root / row['source']
        if digest(path) != row['sha256']:
            raise ValueError('Actual original rendered route pixels changed')
        with Image.open(path) as image:
            image = image.convert('RGBA')
        if image.size != (size, size):
            raise ValueError('An original route view changed dimensions')
        bounds = image.getchannel('A').getbbox()
        if not bounds or min(bounds[:2]) < 2 or max(bounds[2:]) > size-2:
            raise ValueError('An actual original route silhouette is empty or clipped')
        x, y = (index%4)*size, (index//4)*size
        atlas.paste(image, (x, y))
        roles[role] = {'cell': [x,y,x+size,y+size], 'anchor': row['anchor'],
                       'pixelsPerUnit': row['pixelsPerUnit'], 'bounds': list(bounds),
                       'source': row['source'], 'sourceSha256': row['sha256'],
                       'description': row['description'], 'sourceSize': row['size'],
                       'motorCore': row.get('motorCore')}
        if 'renderSource' in row:
            roles[role].update({key: row[key] for key in ('renderSource', 'renderMode')})
            if 'retention' in row:
                roles[role]['retention'] = row['retention']
    output = root / 'public/game-assets/rocket-run/route-kit'
    output.mkdir(parents=True, exist_ok=True)
    path = output / (world+'-route-kit-v1.webp')
    atlas.save(path, format='WEBP', lossless=True, exact=True, method=4)
    with Image.open(path) as actual:
        parity = verify_alpha_and_pixels(atlas, actual.convert('RGBA'))
    if parity['transparentRgbDifferences']:
        raise ValueError('Lossless route delivery changed RGB beneath zero alpha')
    parity['allRgbaBytesEqual'] = True
    primary = {'runtime': '/'+str(path.relative_to(root/'public')), 'runtimeSha256': digest(path),
               'width': atlas.width, 'height': atlas.height, 'roles': roles,
               'runtimeBytes': path.stat().st_size, 'decodedBaseBytes': atlas.width*atlas.height*4,
               'pixelParity': parity, 'trueAlpha': True}
    # Inline delivery retains all seven original role silhouettes. It is
    # requested only after a genuine primary failure, not decoded in parallel.
    inline = 'data:image/webp;base64,'+base64.b64encode(path.read_bytes()).decode('ascii')
    embedded = {**primary, 'fileRuntime': primary['runtime'], 'runtime': inline,
                'inlineBytes': len(inline.encode('ascii'))}
    result = {'world': world, 'primary': primary, 'embedded': embedded,
              'status': 'Actual original route delivery; native composition/collision review OPEN',
              'creator': 'LiteracyGuide original sculpted route props', 'nativeReview': 'UNKNOWN',
              'humanReview': 'UNKNOWN', 'physicalIpad': 'UNKNOWN'}
    (source/'delivery.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({'world': world, 'roles':len(roles),'runtimeBytes':primary['runtimeBytes'],
                      'decodedBaseBytes':primary['decodedBaseBytes'],'pixelParity':parity}))


if __name__ == '__main__':
    main()
