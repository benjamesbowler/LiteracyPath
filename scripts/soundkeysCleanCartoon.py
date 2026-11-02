"""Compile explicitly registered current illustrations; retain sealed history.

Whole generated poses and props are registered before this delivery step. This
encoder never infers new anatomy, parts or contact points from a filename.
"""
from pathlib import Path
import json
import hashlib
import subprocess
import platform
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'source-art/arcade/physical-worlds/soundkeys'
MANIFEST = SOURCE / 'scene-kit-clean-cartoon.json'
VENUE_IDS = {world + suffix for world in ('dino', 'meadow', 'moonwood')
             for suffix in ('-keyboard-venue-v1', '-keyboard-venue-fallback-v1')}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def runtime_assets(assets):
    # Packing measurements, generation receipts and superseded authoring records
    # remain complete in the source manifest. They are not browser inputs and
    # can contain private absolute checkout paths.
    author_only = {'packing', 'generation', 'supersedes'}
    return {name: {key: value for key, value in asset.items() if key not in author_only}
            for name, asset in assets.items()}


def build_current(metadata_only=False, selected_ids=None):
    manifest = json.loads(MANIFEST.read_text())
    for lineage in [manifest['historicalManifest'], manifest['historicalRegistration']]:
        if digest(ROOT / lineage['path']) != lineage['sha256']:
            raise ValueError('Historical SoundKeys input changed: ' + lineage['path'])
    assets = manifest['assets']
    registration_path = ROOT / manifest['registration']['path']
    if digest(registration_path) != manifest['registration']['sha256']:
        raise ValueError('Current SoundKeys registration changed')
    registration = json.loads(registration_path.read_text())['currentSources']
    for name, spec in registration.items():
        asset = assets[name]
        for key in ['source', 'sourceSha256', 'parts', 'frames', 'pixelsPerUnit', 'deliveryRecipe']:
            if asset.get(key) != spec.get(key):
                raise ValueError('Current SoundKeys registration mismatch: ' + name + '/' + key)
    if selected_ids and any(name not in assets or not assets[name].get('productionRevision') for name in selected_ids):
        raise ValueError('Current SoundKeys build names an unregistered source')
    # These six reviewed deliveries use an exact Sharp recipe, including the
    # fallback's actual input: the accepted primary WebP, not the native PNG.
    # PIL re-encoding would silently change their approved bytes.
    selected_venues = VENUE_IDS if selected_ids is None else VENUE_IDS & selected_ids
    if not metadata_only and selected_venues:
        node_command = ['node']
        # An Intel Python under Rosetta can otherwise spawn universal Node as
        # x64 while this Apple Silicon checkout has native arm64 Sharp wheels.
        if (platform.system() == 'Darwin' and platform.machine() == 'x86_64'
                and (ROOT / 'node_modules/@img/sharp-darwin-arm64').exists()
                and not (ROOT / 'node_modules/@img/sharp-darwin-x64').exists()):
            node_command = ['/usr/bin/arch', '-arm64', 'node']
        subprocess.run(node_command + [str(SOURCE / 'clean-cartoon/rebuild-venues.mjs'),
                        '--write', '--asset-ids', ','.join(sorted(selected_venues))],
                       cwd=ROOT, check=True)
    for name, asset in assets.items():
        source, output = ROOT / asset['source'], ROOT / ('public' + asset['runtime'])
        if digest(source) != asset['sourceSha256']:
            raise ValueError('SoundKeys source identity changed: ' + name)
        if asset.get('productionRevision'):
            if digest(ROOT / asset['prompt']) != asset['promptSha256']:
                raise ValueError('SoundKeys prompt identity changed: ' + name)
            if name in VENUE_IDS:
                if digest(output) != asset['runtimeSha256']:
                    raise ValueError('Current SoundKeys venue delivery identity changed: ' + name)
                with Image.open(output) as decoded:
                    if decoded.size != (asset['width'], asset['height']):
                        raise ValueError('Actual SoundKeys venue dimensions changed: ' + name)
                continue
            image = Image.open(source).convert('RGBA')
            recipe = asset.get('deliveryRecipe', {'kind': 'complete-current-source'})
            if recipe['kind'] == 'complete-current-source':
                pass
            elif recipe['kind'] == 'scene-thumbnail':
                image.thumbnail(tuple(recipe['maximumSize']), Image.Resampling.LANCZOS)
            elif recipe['kind'] == 'first-frame-fitted':
                image = image.crop(recipe['sourceCrop'])
                image = image.resize(tuple(recipe['resizedSize']), Image.Resampling.LANCZOS)
                fitted = Image.new('RGBA', tuple(recipe['targetSize']))
                fitted.alpha_composite(image, tuple(recipe['offset']))
                image = fitted
            else:
                raise ValueError('Unknown SoundKeys current delivery recipe: ' + name)
            if image.size != (asset['width'], asset['height']):
                raise ValueError('Current SoundKeys dimensions changed: ' + name)
            if not metadata_only and (not selected_ids or name in selected_ids):
                image.save(output, 'WEBP', quality=asset['encoding']['quality'], method=4, exact=True)
                decoded = Image.open(output).convert('RGBA')
                if decoded.size != image.size or decoded.getchannel('A').tobytes() != image.getchannel('A').tobytes():
                    raise ValueError('Encoded SoundKeys silhouette changed: ' + name)
                asset['runtimeSha256'] = digest(output)
                asset['runtimeBytes'] = output.stat().st_size
            if digest(output) != asset['runtimeSha256']:
                raise ValueError('Current SoundKeys delivery identity changed: ' + name)
            if recipe['kind'] == 'complete-current-source' and asset.get('contactFrames'):
                for index in asset['contactFrames']:
                    for point in asset['frames'][index]['sockets'].values():
                        if image.getpixel(tuple(point))[3] < 192:
                            raise ValueError('Current SoundKeys contact is not opaque: ' + name)
        else:
            if digest(output) != asset['runtimeSha256']:
                raise ValueError('Unchanged SoundKeys delivery changed: ' + name)
        with Image.open(output) as decoded:
            if decoded.size != (asset['width'], asset['height']):
                raise ValueError('Actual SoundKeys delivery dimensions changed: ' + name)
    if not metadata_only:
        MANIFEST.write_text(json.dumps(manifest, indent=2) + '\n')
    data = ROOT / 'src/components/learn/games/games/soundKeysArtData.js'
    data.write_text('// Generated from current source/alpha/key contacts; full authoring provenance stays in the source manifest.\nexport const SOUNDKEYS_ART = ' + json.dumps(runtime_assets(assets), indent=2) + ';\n')
    print(json.dumps({'currentSources': len({a['source'] for a in assets.values() if a.get('productionRevision')}),
                      'currentDeliveries': sum(bool(a.get('productionRevision')) for a in assets.values()),
                      'metadataOnly': metadata_only, 'historicalInputsUnchanged': True}))
