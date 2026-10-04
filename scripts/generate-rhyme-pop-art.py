"""Compile original festival/launcher art with measured physical registrations.

Body assembly preserves original opaque source pixels. No painted letters,
generated contacts or recoloured substitute actors are introduced.
"""
import argparse
import hashlib
import json
import statistics
from pathlib import Path
from PIL import Image
from soundkeysArtPacking import pack_actions

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'source-art/arcade/physical-worlds/rhyme-pop'
RUNTIME = ROOT / 'public/game-assets/physical-arcade/rhyme-pop'


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--metadata-only', action='store_true')
    args = parser.parse_args()
    registration = json.loads((SOURCE / 'launcher-registration-v1.json').read_text())
    manifest_path = SOURCE / 'scene-kit-v1.json'
    previous = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    assets = {}
    RUNTIME.mkdir(parents=True, exist_ok=True)

    def retain(name, original, image, extra=None, quality=90):
        output = RUNTIME / f'{name}.webp'
        source_hash = digest(original)
        signature = hashlib.sha256((source_hash + json.dumps(extra or {}, sort_keys=True)).encode()).hexdigest()
        if not args.metadata_only and (previous.get('assets', {}).get(name, {}).get('assemblySignature') != signature or not output.exists()):
            image.save(output, 'WEBP', quality=quality, method=4, exact=True)
        if not output.exists():
            raise ValueError('Explicit encoder window required before metadata-only delivery')
        assets[name] = {'source': str(original.relative_to(ROOT)), 'sourceSha256': source_hash,
                        'sourceSize': list(Image.open(original).size), 'runtime': '/game-assets/physical-arcade/rhyme-pop/' + output.name,
                        'width': image.width, 'height': image.height, 'runtimeBytes': output.stat().st_size,
                        'runtimeSha256': digest(output), 'assemblySignature': signature, **(extra or {})}

    for character, record in registration['actors'].items():
        original = SOURCE / f'{character}-launcher-actions-v1.png'
        if args.metadata_only:
            former = previous['assets'][f'{character}-launcher-actions-v1']
            image = Image.new('RGBA', (former['width'], former['height']))
            frames, packing = former['frames'], former['packing']
        else:
            image, frames, packing = pack_actions(Image.open(original).convert('RGBA'), record)
        extra = {'frames': frames, 'packing': packing, 'anatomy': record['anatomy'], 'contactFrame': record['contactFrame'],
                 'nominalHeight': 2.2, 'pixelsPerUnit': statistics.median(frame['bounds'][3]-frame['bounds'][1] for frame in frames)/2.2}
        retain(f'{character}-launcher-actions-v1', original, image, extra)
        fallback_name = f'{character}-launcher-fallback-v1'
        if args.metadata_only:
            former = previous['assets'][fallback_name]
            fallback = Image.new('RGBA', (former['width'], former['height']))
        else:
            fallback = image.crop(frames[0]['cell'])
        retain(fallback_name, original, fallback, {'role': 'independent-original-idle-fallback',
                                                  'bodyFrame': 0, 'sourceFrameWindow': record['frameWindows']['0'],
                                                  'sourceAssembly': f'{character}-launcher-actions-v1'})

    for world in ['meadow', 'dino', 'moonwood']:
        original = ROOT / 'source-art/arcade/scenes/rhyme-festival.png' if world == 'meadow' else SOURCE / ('dino-kite-festival-v1.png' if world == 'dino' else 'moonwood-lantern-festival-v1.png')
        image = Image.open(original)
        retain(f'{world}-festival-v1', original, image, {'role': 'empty-deep-festival-venue'})
        fallback = image.copy(); fallback.thumbnail((768, 768))
        retain(f'{world}-festival-fallback-v1', original, fallback, {'role': 'independent-original-venue-fallback'}, quality=78)
        original = SOURCE / f'{world}-launcher-kit-v1.png'
        image = Image.open(original).convert('RGBA')
        retain(f'{world}-launcher-kit-v1', original, image, {'parts': registration['kits'][world]})
        fallback = image.copy(); fallback.thumbnail((768, 768))
        scale_x, scale_y = fallback.width/image.width, fallback.height/image.height
        parts = {key: [[round(v[0]*scale_x, 3), round(v[1]*scale_y, 3), round(v[2]*scale_x, 3), round(v[3]*scale_y, 3)] for v in value] if key == 'balloons'
                 else [[round(v[0]*scale_x, 3), round(v[1]*scale_y, 3)] for v in value] if key == 'faces'
                 else [round(v*(scale_x if i % 2 == 0 else scale_y), 3) for i, v in enumerate(value)] for key, value in registration['kits'][world].items()}
        retain(f'{world}-launcher-kit-fallback-v1', original, fallback, {'parts': parts, 'role': 'independent-original-kit-fallback'}, quality=78)

    manifest = {'schemaVersion': 1, 'game': 'rhyme-pop', 'creator': 'Original Literacy Guide authoring; OpenAI built-in image generation',
                'rights': 'Original project assets and canon references; exact source/prompt provenance retained',
                'review': previous.get('review', {'status': 'Original source registration; actual runtime/native proof pending', 'humanListening': 'UNKNOWN', 'physicalIpad': 'UNKNOWN'}),
                'assets': assets}
    manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
    (ROOT / 'src/components/learn/games/games/rhymePopArtData.js').write_text('// Generated from original festival/launcher source and measured sockets.\nexport const RHYME_POP_ART = ' + json.dumps(assets, indent=2) + ';\n')
    print(json.dumps({'assets': len(assets), 'bytes': sum(row['runtimeBytes'] for row in assets.values())}))


if __name__ == '__main__':
    main()
