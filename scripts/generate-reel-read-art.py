"""Compile retained original fishing art with measured bodies and tool grips.

Encoding runs only in an explicitly coordinated production window. Source
pixels, atlas assembly and the real rod/reel/hook geometry remain separate.
"""
import argparse
import hashlib
import json
import statistics
from pathlib import Path
from PIL import Image
from soundkeysArtPacking import pack_actions, isolate_body

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'source-art/arcade/physical-worlds/reel-read'
RUNTIME = ROOT / 'public/game-assets/physical-arcade/reel-read'


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def scale_parts(parts, sx, sy):
    result = {}
    for key, value in parts.items():
        if isinstance(value, list):
            result[key] = [[round(n*(sx if i % 2 == 0 else sy), 4) for i, n in enumerate(row)] for row in value] if value and isinstance(value[0], list) else [round(n*(sx if i % 2 == 0 else sy), 4) for i, n in enumerate(value)]
        else:
            result[key] = value
    return result


def register_reduced_tool_contacts(image, parts):
    """Retain the exact scaled source point and measure its delivered edge.

    A downsampled one-pixel rod edge may have translucent alpha at the nearest
    integer sample. Register the nearest opaque pixel of that same resampled
    tool, within one delivery pixel, without repainting or deleting any art.
    """
    measured = {}
    for name in ['rodGrip', 'reelGrip', 'rodTip']:
        original = list(parts[name])
        x, y = map(round, original)
        chosen = original
        if image.getpixel((x, y))[3] < 192:
            candidates = []
            for px in range(x-1, x+2):
                for py in range(y-1, y+2):
                    distance = ((px-original[0])**2+(py-original[1])**2)**.5
                    if 0 <= px < image.width and 0 <= py < image.height and distance <= 1:
                        alpha = image.getpixel((px, py))[3]
                        if alpha >= 192:
                            candidates.append((distance, -alpha, px, py))
            if not candidates:
                raise ValueError(f'{name} has no original-resampled opaque tool pixel within 1px')
            _, _, px, py = min(candidates)
            chosen = [px, py]
        parts[name] = chosen
        measured[name] = {'scaledOriginalPoint': original, 'deliveredPoint': chosen,
                          'deltaPixels': [chosen[0]-original[0], chosen[1]-original[1]],
                          'deliveredAlpha': image.getpixel(tuple(map(round, chosen)))[3]}
    return {'method': 'nearest-delivered-opaque-tool-pixel', 'maximumRadiusPixels': 1,
            'artPixelsChanged': False, 'sockets': measured}


def assemble_kit(image, original_parts):
    # A rectangle around the source rod also contains the neighboring hull's
    # bow. Give physical parts independent atlas cells rather than painting
    # that unrelated bow beside a moving rod. Only the rod needs connected
    # component isolation; the other guarded source windows retain all pixels.
    atlas = Image.new('RGBA', (2048, 1280), (0, 0, 0, 0))
    positions = {'hull': (0, 0), 'frontRail': (900, 0), 'rod': (900, 190),
                 'leftBank': (0, 710), 'jetty': (430, 710), 'rope': (854, 710),
                 'basket': (1080, 710), 'rightBank': (1340, 710),
                 'bobber': (1660, 710), 'hook': (1840, 710),
                 'smallRipple': (854, 1000), 'largeRipple': (1170, 1000)}
    assembled, proof = {}, []

    def part(name, window, destination):
        crop = image.crop(window)
        isolation = None
        if name == 'rod':
            crop, isolation, body = isolate_body(image, window)
            for index in body:
                x, y = index % crop.width, index // crop.width
                if crop.getpixel((x, y)) != image.getpixel((window[0]+x, window[1]+y)):
                    raise ValueError('Original rod body pixel changed')
        x, y = destination
        rect = [x, y, x+crop.width, y+crop.height]
        if rect[2] > atlas.width or rect[3] > atlas.height:
            raise ValueError(f'{name} outside owned semantic atlas')
        for prior in proof:
            old = prior['runtimeCell']
            if min(old[2], rect[2]) > max(old[0], rect[0]) and min(old[3], rect[3]) > max(old[1], rect[1]):
                raise ValueError(f'{name} overlaps {prior["name"]}')
        atlas.paste(crop, (x, y))
        proof.append({'name': name, 'originalWindow': window, 'runtimeCell': rect,
                      'sourceToRuntimeTranslation': [x-window[0], y-window[1]],
                      'policy': 'original-rod-component' if isolation else 'all-original-window-pixels',
                      'bodyIsolation': isolation})
        return rect

    for name, position in positions.items():
        assembled[name] = part(name, original_parts[name], position)
    assembled['fish'] = []
    assembled['labelCentres'] = []
    for index, (window, centre) in enumerate(zip(original_parts['fish'], original_parts['labelCentres'])):
        rect = part(f'fish{index}', window, ([0, 300, 566, 834, 1101, 1370][index], 410))
        assembled['fish'].append(rect)
        assembled['labelCentres'].append([rect[0]+centre[0]-window[0], rect[1]+centre[1]-window[1]])
    rod = assembled['rod']
    original = original_parts['rod']
    for name in ['rodGrip', 'reelGrip', 'rodTip']:
        point = original_parts[name]
        translated = [rod[0]+point[0]-original[0], rod[1]+point[1]-original[1]]
        if atlas.getpixel(tuple(translated))[3] < 192:
            raise ValueError(f'{name} lost its actual opaque tool contact')
        assembled[name] = translated
    assembled['labelAngle'] = original_parts['labelAngle']
    return atlas, assembled, {'method': 'independent-original-semantic-part-cells', 'sourcePixelsResized': False,
                              'nativeContactStatus': 'PENDING actual grip/cast/reel/hook review', 'parts': proof}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--metadata-only', action='store_true')
    args = parser.parse_args()
    registration = json.loads((SOURCE / 'fishing-registration-v1.json').read_text())
    manifest_path = SOURCE / 'scene-kit-v1.json'
    previous = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    assets = {}
    RUNTIME.mkdir(parents=True, exist_ok=True)

    def retain(name, original, image, extra=None, quality=90):
        output = RUNTIME / f'{name}.webp'
        source_hash = digest(original)
        signature = hashlib.sha256((source_hash+json.dumps(extra or {}, sort_keys=True)).encode()).hexdigest()
        if not args.metadata_only and (previous.get('assets', {}).get(name, {}).get('assemblySignature') != signature or not output.exists()):
            image.save(output, 'WEBP', quality=quality, method=4, exact=True)
        if not output.exists():
            raise ValueError('Explicit encoder window required before metadata-only delivery')
        assets[name] = {'source': str(original.relative_to(ROOT)), 'sourceSha256': source_hash,
                        'sourceSize': list(Image.open(original).size), 'runtime': '/game-assets/physical-arcade/reel-read/'+output.name,
                        'width': image.width, 'height': image.height, 'runtimeBytes': output.stat().st_size,
                        'runtimeSha256': digest(output), 'assemblySignature': signature, **(extra or {})}

    for character, record in registration['actors'].items():
        original = SOURCE / f'{character}-fishing-actions-v1.png'
        if args.metadata_only:
            former = previous['assets'][f'{character}-fishing-actions-v1']
            image = Image.new('RGBA', (former['width'], former['height']))
            frames, packing = former['frames'], former['packing']
        else:
            image, frames, packing = pack_actions(Image.open(original).convert('RGBA'), record)
        ppu = statistics.median(frame['bounds'][3]-frame['bounds'][1] for frame in frames)/2.2
        retain(f'{character}-fishing-actions-v1', original, image,
               {'frames': frames, 'packing': packing, 'anatomy': record['anatomy'], 'phases': registration['phases'],
                'nominalHeight': 2.2, 'pixelsPerUnit': ppu})
        first = frames[0]
        cell = first['cell']
        fallback = image.crop(cell)
        fallback_frame = {**first, 'cell': [0, 0, fallback.width, fallback.height],
                          'sockets': {key: [point[0]-cell[0], point[1]-cell[1]] for key, point in first['sockets'].items()}}
        retain(f'{character}-fishing-fallback-v1', original, fallback,
               {'role': 'independent-original-idle-fallback', 'sourceFrameWindow': record['frameWindows']['0'],
                'frames': [fallback_frame], 'nominalHeight': 2.2, 'pixelsPerUnit': ppu})

    for world, venue_name in [('meadow', 'meadow-pond'), ('dino', 'dino-lagoon'), ('moonwood', 'moonwood-lake')]:
        original = SOURCE / f'{venue_name}-venue-v1.png'
        image = Image.open(original)
        retain(f'{world}-fishing-venue-v1', original, image,
               {'role': 'empty-deep-fishing-venue', 'sourceWaterlineRatio': .51, 'liveWaterOwnsFishLineHook': True})
        fallback = image.copy()
        fallback.thumbnail((768, 768))
        retain(f'{world}-fishing-venue-fallback-v1', original, fallback,
               {'role': 'independent-original-venue-fallback', 'sourceWaterlineRatio': .51}, quality=78)
        original = SOURCE / f'{world}-fishing-kit-v1.png'
        source_image = Image.open(original).convert('RGBA')
        original_parts = registration['kits'][world]
        for name in ['rodGrip', 'reelGrip', 'rodTip']:
            if source_image.getpixel(tuple(original_parts[name]))[3] < 192:
                raise ValueError(f'{world} {name} is not on actual opaque tool anatomy')
        if args.metadata_only:
            former = previous['assets'][f'{world}-fishing-kit-v1']
            image = Image.new('RGBA', (former['width'], former['height']))
            parts, assembly = former['parts'], former['partsAssembly']
        else:
            image, parts, assembly = assemble_kit(source_image, original_parts)
        retain(f'{world}-fishing-kit-v1', original, image, {'parts': parts, 'partsAssembly': assembly})
        fallback = image.copy()
        fallback.thumbnail((768, 768))
        retain(f'{world}-fishing-kit-fallback-v1', original, fallback,
               {'parts': scale_parts(parts, fallback.width/image.width, fallback.height/image.height),
                'role': 'independent-original-kit-fallback'}, quality=78)
        fallback_name = f'{world}-fishing-kit-fallback-v1'
        delivered = Image.open(RUNTIME / f'{fallback_name}.webp').convert('RGBA')
        assets[fallback_name]['fallbackContactRegistration'] = register_reduced_tool_contacts(
            delivered, assets[fallback_name]['parts'])

    manifest = {'schemaVersion': 1, 'game': 'reel-read', 'creator': 'Original Literacy Guide authoring; OpenAI built-in image generation',
                'rights': 'Original project assets and canon references; exact source/prompt provenance retained',
                'review': previous.get('review', {'status': 'Original source registration; actual runtime/native proof pending', 'humanListening': 'UNKNOWN', 'physicalIpad': 'UNKNOWN'}),
                'assets': assets}
    manifest_path.write_text(json.dumps(manifest, indent=2)+'\n')
    (ROOT / 'src/components/learn/games/games/reelReadArtData.js').write_text('// Generated from original fishing sources and measured visible grips.\nexport const REEL_READ_ART = '+json.dumps(assets, indent=2)+';\n')
    print(json.dumps({'assets': len(assets), 'bytes': sum(row['runtimeBytes'] for row in assets.values())}))


if __name__ == '__main__':
    main()
