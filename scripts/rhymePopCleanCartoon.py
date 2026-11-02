"""Compile explicitly registered current launcher sources; preserve history.

Whole generated bodies and prop landmarks are registered before encoding.
Metadata-only mode checks exact deliveries and never invokes an image encoder.
"""
from pathlib import Path
import json
import hashlib
import platform
import subprocess
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'source-art/arcade/physical-worlds/rhyme-pop'
MANIFEST = SOURCE / 'scene-kit-clean-cartoon.json'
VENUES = {f'{world}-festival{suffix}-v1' for world in ['dino', 'meadow', 'moonwood']
          for suffix in ['', '-fallback']}


def node_command():
    if (platform.system() == 'Darwin' and platform.machine() == 'x86_64'
            and (ROOT / 'node_modules/@img/sharp-darwin-arm64').exists()
            and not (ROOT / 'node_modules/@img/sharp-darwin-x64').exists()):
        return ['/usr/bin/arch', '-arm64', 'node']
    return ['node']


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def build_current(metadata_only=False, selected_ids=None):
    manifest = json.loads(MANIFEST.read_text())
    for lineage in [manifest['historicalManifest'], manifest['historicalRegistration'], manifest['registration']]:
        if digest(ROOT / lineage['path']) != lineage['sha256']:
            raise ValueError('Rhyme Pop source authority changed: ' + lineage['path'])
    assets = manifest['assets']
    registration = json.loads((ROOT / manifest['registration']['path']).read_text())['currentSources']
    for name, spec in registration.items():
        for key in ['source', 'sourceSha256', 'parts', 'frames', 'pixelsPerUnit', 'deliveryRecipe']:
            if assets[name].get(key) != spec.get(key):
                raise ValueError('Current Rhyme Pop registration mismatch: ' + name + '/' + key)
    if selected_ids and any(name not in assets or not assets[name].get('productionRevision') for name in selected_ids):
        raise ValueError('Current Rhyme Pop build names an unregistered source')
    for name, asset in assets.items():
        if name in VENUES:
            continue  # The independent Sharp helper preserves accepted venues.
        source, output = ROOT / asset['source'], ROOT / ('public' + asset['runtime'])
        if digest(source) != asset['sourceSha256']:
            raise ValueError('Rhyme Pop source identity changed: ' + name)
        if asset.get('productionRevision'):
            if digest(ROOT / asset['prompt']) != asset['promptSha256']:
                raise ValueError('Rhyme Pop retained prompt changed: ' + name)
            recipe = asset['deliveryRecipe']
            if not metadata_only and (not selected_ids or name in selected_ids):
                image = Image.open(source).convert('RGBA')
                if recipe['kind'] == 'complete-current-source':
                    pass
                elif recipe['kind'] == 'scene-thumbnail':
                    image.thumbnail(tuple(recipe['maximumSize']), Image.Resampling.LANCZOS)
                elif recipe['kind'] == 'current-idle-crop':
                    image = image.crop(recipe['sourceCrop'])
                else:
                    raise ValueError('Unknown current Rhyme Pop delivery recipe: ' + name)
                if image.size != (asset['width'], asset['height']):
                    raise ValueError('Current Rhyme Pop dimensions changed: ' + name)
                image.save(output, 'WEBP', quality=asset['encoding']['quality'], method=4, exact=True)
                if Image.open(output).convert('RGBA').getchannel('A').tobytes() != image.getchannel('A').tobytes():
                    raise ValueError('Current Rhyme Pop delivered alpha changed: ' + name)
                asset['runtimeSha256'] = digest(output)
                asset['runtimeBytes'] = output.stat().st_size
        if digest(output) != asset['runtimeSha256']:
            raise ValueError('Rhyme Pop delivery identity changed: ' + name)
        with Image.open(output) as decoded:
            if decoded.size != (asset['width'], asset['height']):
                raise ValueError('Actual Rhyme Pop delivery dimensions changed: ' + name)
    if metadata_only:
        subprocess.run(node_command() + [str(ROOT / 'tools/rhymePopVenueArt.mjs')], cwd=ROOT, check=True)
        return
    MANIFEST.write_text(json.dumps(manifest, indent=2) + '\n')
    helper = (ROOT / 'tools/rhymePopVenueArt.mjs').as_uri()
    script = ('import {buildRhymePopVenues} from ' + json.dumps(helper) + ';'
              'console.log(JSON.stringify(await buildRhymePopVenues({write:true,selectedIds:new Set()})));')
    subprocess.run(node_command() + ['--input-type=module', '-e', script], cwd=ROOT, check=True)
    selected_venues = VENUES if selected_ids is None else selected_ids & VENUES
    if selected_venues:
        subprocess.run(node_command() + [str(ROOT / 'tools/rhymePopVenueArt.mjs'), '--write', '--asset-ids',
                       ','.join(sorted(selected_venues))], cwd=ROOT, check=True)
