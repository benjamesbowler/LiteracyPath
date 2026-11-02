"""Compile current complete performers and measured musical props.

Historical source sheets/registration remain sealed. Metadata-only validates
exact current inputs and deliveries without encoding or modifying them.
"""
from pathlib import Path
from PIL import Image
import json
import hashlib
import platform
import subprocess
ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'source-art/arcade/physical-worlds/sound-beat'
MANIFEST = SOURCE / 'scene-kit-clean-cartoon.json'
DESTINATION = ROOT / 'src/components/learn/games/games/soundBeatArtData.js'
AUTHOR_ONLY = {'packing', 'generation', 'supersedes', 'originalOutput', 'references'}
VENUES = {f'{world}-concert-venue-v1' for world in ['dino', 'meadow', 'moonwood']}
def node_command():
    if (platform.system() == 'Darwin' and platform.machine() == 'x86_64'
            and (ROOT / 'node_modules/@img/sharp-darwin-arm64').exists()
            and not (ROOT / 'node_modules/@img/sharp-darwin-x64').exists()):
        return ['/usr/bin/arch', '-arm64', 'node']
    return ['node']
def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()
def runtime_assets(assets):
    return {name: {key: value for key, value in asset.items() if key not in AUTHOR_ONLY}
            for name, asset in assets.items() if not asset.get('sourceOnly')}
def build_current(metadata_only=False, selected_ids=None):
    manifest = json.loads(MANIFEST.read_text())
    for lineage in [manifest['historicalManifest'], manifest['historicalRegistration'], manifest['registration']]:
        if digest(ROOT / lineage['path']) != lineage['sha256']:
            raise ValueError('Musical source authority changed: ' + lineage['path'])
    assets = manifest['assets']
    for name, spec in json.loads((ROOT / manifest['registration']['path']).read_text())['currentSources'].items():
        for key, value in spec.items():
            if assets[name].get(key) != value:
                raise ValueError('Musical registration changed: ' + name + '/' + key)
    if selected_ids and any(name not in assets or not assets[name].get('productionRevision') for name in selected_ids):
        raise ValueError('Current musical build names an unregistered source')
    for name, asset in assets.items():
        if name in VENUES:
            continue  # The reviewed Sharp helper owns only these three venues.
        source = ROOT / asset['source']
        if digest(source) != asset['sourceSha256']:
            raise ValueError('Musical source changed: ' + name)
        if asset.get('sourceOnly'):
            continue
        output = ROOT / ('public' + asset['runtime'])
        if asset.get('productionRevision'):
            if digest(ROOT / asset['prompt']) != asset['promptSha256']:
                raise ValueError('Musical prompt changed: ' + name)
            if not metadata_only and (selected_ids is None or name in selected_ids):
                image = Image.open(source).convert('RGBA')
                if asset['deliveryRecipe']['kind'] != 'complete-current-source':
                    raise ValueError('Unknown current musical delivery recipe: ' + name)
                if image.size != (asset['width'], asset['height']):
                    raise ValueError('Musical dimensions changed: ' + name)
                image.save(output, 'WEBP', quality=asset['encoding']['quality'], method=6, exact=True)
                if Image.open(output).convert('RGBA').getchannel('A').tobytes() != image.getchannel('A').tobytes():
                    raise ValueError('Musical alpha changed: ' + name)
                asset['runtimeSha256'] = digest(output)
                asset['runtimeBytes'] = output.stat().st_size
        if digest(output) != asset['runtimeSha256']:
            raise ValueError('Musical delivery changed: ' + name)
        image = Image.open(output).convert('RGBA')
        if image.size != (asset['width'], asset['height']):
            raise ValueError('Musical delivery size changed: ' + name)
        for frame in asset.get('frames', []):
            points = list(frame.get('sockets', {}).values())
            points += [frame[key] for key in ['leftHandPixel', 'rightHandPixel'] if key in frame]
            if any(image.getpixel(tuple(map(round, point)))[3] < 192 for point in points):
                raise ValueError('Musical grip not actual opaque delivery: ' + name)
    if metadata_only:
        subprocess.run(node_command() + [str(ROOT / 'tools/soundBeatVenueArt.mjs')], cwd=ROOT, check=True)
        return
    MANIFEST.write_text(json.dumps(manifest, indent=2) + '\n')
    helper = (ROOT / 'tools/soundBeatVenueArt.mjs').as_uri()
    script = ('import {buildSoundBeatVenues} from ' + json.dumps(helper) + ';'
              'console.log(JSON.stringify(await buildSoundBeatVenues({write:true,selectedIds:new Set()})));')
    subprocess.run(node_command() + ['--input-type=module', '-e', script], cwd=ROOT, check=True)
    selected_venues = VENUES if selected_ids is None else selected_ids & VENUES
    if selected_venues:
        subprocess.run(node_command() + [str(ROOT / 'tools/soundBeatVenueArt.mjs'), '--write', '--asset-ids',
                       ','.join(sorted(selected_venues))], cwd=ROOT, check=True)
