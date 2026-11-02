"""Encode registered current fishing bodies/tools while retaining sealed venues.

The venue helper keeps its accepted Sharp recipes. Actor/kit registration owns
the complete-body canvases, real anatomical grips and independent derivatives.
"""
from pathlib import Path
import json
import hashlib
import platform
import subprocess
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'source-art/arcade/physical-worlds/reel-read'
MANIFEST = SOURCE / 'scene-kit-clean-cartoon.json'
VENUES = {world + suffix for world in ['meadow', 'dino', 'moonwood']
          for suffix in ['-fishing-venue-v1', '-fishing-venue-fallback-v1']}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def node_command():
    if (platform.system() == 'Darwin' and platform.machine() == 'x86_64'
            and (ROOT / 'node_modules/@img/sharp-darwin-arm64').exists()
            and not (ROOT / 'node_modules/@img/sharp-darwin-x64').exists()):
        return ['/usr/bin/arch', '-arm64', 'node']
    return ['node']


def build_current(metadata_only=False, selected_ids=None):
    manifest = json.loads(MANIFEST.read_text())
    for lineage in [manifest['historicalManifest'], manifest['historicalRegistration'], manifest['registration']]:
        if digest(ROOT / lineage['path']) != lineage['sha256']:
            raise ValueError('Reel source authority changed: ' + lineage['path'])
    assets = manifest['assets']
    registration = json.loads((ROOT / manifest['registration']['path']).read_text())['currentSources']
    for name, spec in registration.items():
        for key in ['source', 'sourceSha256', 'frames', 'parts', 'pixelsPerUnit', 'deliveryRecipe']:
            if assets[name].get(key) != spec.get(key):
                raise ValueError('Current Reel registration mismatch: ' + name + '/' + key)
    if selected_ids and any(name not in assets or not assets[name].get('productionRevision') for name in selected_ids):
        raise ValueError('Current Reel build names an unregistered source')
    for name, asset in assets.items():
        if name in VENUES:
            continue  # The independent accepted Sharp venue helper validates these.
        source, output = ROOT / asset['source'], ROOT / ('public' + asset['runtime'])
        if digest(source) != asset['sourceSha256']:
            raise ValueError('Current Reel source changed: ' + name)
        if asset.get('productionRevision'):
            if digest(ROOT / asset['prompt']) != asset['promptSha256']:
                raise ValueError('Current Reel prompt changed: ' + name)
            if not metadata_only and (selected_ids is None or name in selected_ids):
                image = Image.open(source).convert('RGBA')
                recipe = asset['deliveryRecipe']
                if recipe['kind'] == 'complete-current-source':
                    pass
                elif recipe['kind'] == 'current-idle-crop':
                    image = image.crop(recipe['sourceCrop'])
                elif recipe['kind'] == 'scene-thumbnail':
                    image.thumbnail(tuple(recipe['maximumSize']), Image.Resampling.LANCZOS)
                else:
                    raise ValueError('Unknown current Reel recipe: ' + name)
                if image.size != (asset['width'], asset['height']):
                    raise ValueError('Current Reel recipe dimensions changed: ' + name)
                image.save(output, 'WEBP', quality=asset['encoding']['quality'], method=4, exact=True)
                if Image.open(output).convert('RGBA').getchannel('A').tobytes() != image.getchannel('A').tobytes():
                    raise ValueError('Current Reel delivered alpha changed: ' + name)
                asset['runtimeSha256'] = digest(output)
                asset['runtimeBytes'] = output.stat().st_size
        if digest(output) != asset['runtimeSha256']:
            raise ValueError('Current Reel delivery changed: ' + name)
        with Image.open(output) as decoded:
            if decoded.size != (asset['width'], asset['height']):
                raise ValueError('Current Reel delivery dimensions changed: ' + name)
            for frame in asset.get('frames', []):
                for point in frame['sockets'].values():
                    if decoded.convert('RGBA').getpixel(tuple(map(round, point)))[3] < 192:
                        raise ValueError('Current Reel delivered hand is not opaque: ' + name)
    if metadata_only:
        subprocess.run(node_command() + [str(ROOT / 'tools/reelReadVenueArt.mjs')], cwd=ROOT, check=True)
        return
    MANIFEST.write_text(json.dumps(manifest, indent=2) + '\n')
    # Emit the exact Node runtime representation through the existing helper,
    # with an empty venue selection so actor builds never rewrite frozen venues.
    helper = (ROOT / 'tools/reelReadVenueArt.mjs').as_uri()
    script = ('import {buildReelReadVenues} from ' + json.dumps(helper) + ';'
              'console.log(JSON.stringify(await buildReelReadVenues({write:true,selectedIds:new Set()})));')
    subprocess.run(node_command() + ['--input-type=module', '-e', script], cwd=ROOT, check=True)
    selected_venues = VENUES if selected_ids is None else selected_ids & VENUES
    if selected_venues:
        subprocess.run(node_command() + [str(ROOT / 'tools/reelReadVenueArt.mjs'), '--write', '--asset-ids',
                       ','.join(sorted(selected_venues))], cwd=ROOT, check=True)
