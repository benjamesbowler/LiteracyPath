"""Measure retained alpha/registration; encode only missing or changed originals.

No painted pixels are edited. --metadata-only never runs the WebP encoder.
"""
from pathlib import Path
import argparse
import hashlib
import json
import statistics
from PIL import Image
from soundkeysArtPacking import pack_actions

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'source-art/arcade/physical-worlds/soundkeys'
RUNTIME = ROOT / 'public/game-assets/physical-arcade/soundkeys'


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def frames(image, sockets, windows=None):
    alpha = image.getchannel('A')
    measured = []
    for index in range(16):
        col, row = index % 4, index // 4
        grid = (windows or {}).get(str(index)) or [round(col * image.width / 4), round(row * image.height / 4), round((col + 1) * image.width / 4), round((row + 1) * image.height / 4)]
        bounds = alpha.crop(grid).point(lambda pixel: 255 if pixel >= 192 else 0).getbbox()
        if not bounds:
            raise ValueError(f'Empty action body {index}')
        left, top, right, bottom = [bounds[0] + grid[0], bounds[1] + grid[1], bounds[2] + grid[0], bounds[3] + grid[1]]
        cell = [max(grid[0], left - 3), max(grid[1], top - 3), min(grid[2], right + 3), min(grid[3], bottom + 3)]
        feet = [x for x in range(left, right) if any(alpha.getpixel((x, y)) >= 192 for y in range(max(top, bottom - 6), bottom))]
        anchor = [round(statistics.mean(feet) - cell[0], 3), bottom - cell[1]]
        record = {'id': index, 'cell': cell, 'anchor': anchor, 'bounds': [left - cell[0], top - cell[1], right - cell[0], bottom - cell[1]], 'sockets': sockets.get(str(index), {})}
        for name, point in record['sockets'].items():
            if not (cell[0] <= point[0] < cell[2] and cell[1] <= point[1] < cell[3] and alpha.getpixel(tuple(point)) >= 192):
                raise ValueError(f'Nonopaque/out-of-frame {name} socket {index}: {point}')
        measured.append(record)
    return measured


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--metadata-only', action='store_true')
    args = parser.parse_args()
    registration = json.loads((SOURCE / 'key-registration-v1.json').read_text())
    previous = json.loads((SOURCE / 'scene-kit-v1.json').read_text()) if (SOURCE / 'scene-kit-v1.json').exists() else {}
    assets = {}
    RUNTIME.mkdir(parents=True, exist_ok=True)
    for path in sorted(SOURCE.glob('*-v1.png')):
        image = Image.open(path)
        name = path.stem
        output = RUNTIME / f'{name}.webp'
        source_hash = digest(path)
        changed = previous.get('assets', {}).get(name, {}).get('sourceSha256') != source_hash
        packed_frames, packing = None, None
        if 'keyboard-actions' in name and registration[name.split('-')[0]].get('packed'):
            character = name.split('-')[0]
            if args.metadata_only:
                existing = previous.get('assets', {}).get(name, {})
                if not existing.get('packing'):
                    raise ValueError('Packed art must first be built in an explicit encoder window')
                image = Image.new('RGBA', (existing['width'], existing['height']))
                packed_frames, packing = existing['frames'], existing['packing']
            else:
                image, packed_frames, packing = pack_actions(image, registration[character])
            signature = hashlib.sha256((source_hash + json.dumps(registration[character], sort_keys=True) + digest(ROOT / 'scripts/soundkeysArtPacking.py')).encode()).hexdigest()
            changed = changed or previous.get('assets', {}).get(name, {}).get('runtimeAssemblySignature') != signature
        if not args.metadata_only and (changed or not output.exists()):
            image.save(output, 'WEBP', quality=90, method=4, exact=True)
        asset = {'source': str(path.relative_to(ROOT)), 'runtime': '/game-assets/physical-arcade/soundkeys/' + output.name,
                 'width': image.width, 'height': image.height, 'sourceBytes': path.stat().st_size, 'sourceSha256': source_hash,
                 'runtimeBytes': output.stat().st_size if output.exists() else None, 'runtimeSha256': digest(output) if output.exists() else None}
        if 'keyboard-actions' in name:
            character = name.split('-')[0]
            asset['frames'] = packed_frames or frames(image, registration[character]['sockets'], registration[character].get('frameWindows'))
            asset['contactFrames'] = registration[character].get('contactFrames', list(range(4, 12)))
            if packing:
                source_dimensions = Image.open(path).size
                asset['sourceSize'] = list(source_dimensions)
                asset['packing'] = packing
                asset['runtimeAssemblySignature'] = signature
            asset['nominalHeight'] = 2.2
            asset['pixelsPerUnit'] = statistics.median(frame['bounds'][3] - frame['bounds'][1] for frame in asset['frames']) / 2.2
            asset['anatomy'] = registration[character]['anatomy']
        elif name.endswith('instrument-kit-v1'):
            asset['parts'] = registration['kit'] if name == 'instrument-kit-v1' else registration['kits'][name]
        assets[name] = asset
        if 'keyboard-venue' in name or name.endswith('instrument-kit-v1'):
            fallback_name = name.replace('-v1', '-fallback-v1')
            fallback_output = RUNTIME / (fallback_name + '.webp')
            if args.metadata_only:
                if fallback_name not in previous.get('assets', {}):
                    raise ValueError('Scene fallback must first be built in an encoder window')
                assets[fallback_name] = previous['assets'][fallback_name]
            else:
                fallback = image.copy()
                fallback.thumbnail((768, 768), Image.Resampling.LANCZOS)
                if changed or not fallback_output.exists():
                    fallback.save(fallback_output, 'WEBP', quality=78, method=4, exact=True)
                factor_x, factor_y = fallback.width / image.width, fallback.height / image.height
                assets[fallback_name] = {'source': asset['source'], 'sourceSha256': source_hash, 'sourceSize': list(image.size),
                    'runtime': '/game-assets/physical-arcade/soundkeys/' + fallback_output.name,
                    'runtimeBytes': fallback_output.stat().st_size, 'runtimeSha256': digest(fallback_output),
                    'width': fallback.width, 'height': fallback.height,
                    'role': 'Independent lower-resolution original scene for primary art failure; same playable key geometry'}
                if asset.get('parts'):
                    assets[fallback_name]['parts'] = {part: [round(x * factor_x), round(y * factor_y), round(r * factor_x), round(b * factor_y)]
                        for part, (x, y, r, b) in asset['parts'].items()}
        if 'keyboard-actions' in name:
            fallback_name = character + '-keyboard-fallback-v1'
            fallback_output = RUNTIME / (fallback_name + '.webp')
            if args.metadata_only:
                if fallback_name not in previous.get('assets', {}):
                    raise ValueError('Fallback art must first be built in an encoder window')
                assets[fallback_name] = previous['assets'][fallback_name]
            else:
                first = asset['frames'][0]
                fallback = image.crop(first['cell'])
                if changed or not fallback_output.exists():
                    fallback.save(fallback_output, 'WEBP', quality=84, method=4, exact=True)
                assets[fallback_name] = {'source': asset['source'], 'sourceSha256': source_hash, 'sourceSize': list(Image.open(path).size),
                    'runtime': '/game-assets/physical-arcade/soundkeys/' + fallback_output.name,
                    'runtimeBytes': fallback_output.stat().st_size, 'runtimeSha256': digest(fallback_output),
                    'width': fallback.width, 'height': fallback.height, 'pixelsPerUnit': asset['pixelsPerUnit'], 'nominalHeight': 2.2,
                    'frames': [{'id': 0, 'cell': [0, 0, fallback.width, fallback.height], 'anchor': first['anchor'], 'bounds': first['bounds'], 'sockets': {}}],
                    'role': 'Independent original idle body for action-atlas failure; never claims animated contact delivery',
                    'originalFrame': 0, 'anatomy': asset['anatomy']}
    review = previous.get('review', {'status': 'originals and measured alpha/sockets; actual runtime/native proof pending', 'humanListening': 'UNKNOWN', 'physicalIpad': 'UNKNOWN', 'hardwareMidi': 'UNKNOWN'})
    manifest = {'schemaVersion': 1, 'game': 'soundkeys', 'creator': 'OpenAI built-in image generation; original Literacy Guide authoring',
                'rights': 'Original generated project assets; canonical project reference art retained', 'review': review, 'assets': assets}
    (SOURCE / 'scene-kit-v1.json').write_text(json.dumps(manifest, indent=2) + '\n')
    data = ROOT / 'src/components/learn/games/games/soundKeysArtData.js'
    data.write_text('// Generated from the retained original/alpha/key socket authority.\nexport const SOUNDKEYS_ART = ' + json.dumps(assets, indent=2) + ';\n')
    print(json.dumps({name: {'runtimeBytes': asset['runtimeBytes'], 'frames': len(asset.get('frames', []))} for name, asset in assets.items()}))


if __name__ == '__main__':
    main()
