"""Pack the finite original384-tight driver candidate without changing pixels.

The legacy256 recipe and its already retained fingerprints remain intact.
This is candidate delivery only; the ordinary runtime does not select v2 until
its actual complete source/contact/pixel/native review has passed.
"""
import hashlib
import json
import os
import shutil
import sys
from PIL import Image

ROOT = sys.argv[sys.argv.index('--') + 1]
WORLD = sys.argv[sys.argv.index('--world') + 1]
VIEW = int(sys.argv[sys.argv.index('--view') + 1])
CHARACTER = {'meadow': 'bouncy', 'dino': 'chompy', 'moonwood': 'pip'}[WORLD]
assert VIEW in range(8)
SOURCE = os.path.join(ROOT, 'source-art/arcade/sound-racer-3d/recovery384', CHARACTER, 'view-' + str(VIEW), 'frames')
if '--source' in sys.argv:
    SOURCE = sys.argv[sys.argv.index('--source') + 1]
record = json.load(open(os.path.join(SOURCE, 'registration.json')))
states = ['drive', 'turn_left', 'turn_right', 'brake', 'recover', 'celebrate']
phases = [0, .25, .5, .75]
assert record['world'] == WORLD and record['character'] == CHARACTER and record['view'] == VIEW
assert record['cell'] == [384, 384] and record['viewSheet'] == [1536, 2304]
assert record['states'] == states and record['phases'] == phases and len(record['frames']) == 24
assert record['framing']['mode'] == 'native-pose-union' and record['framing']['unionPoseCount'] == 24
assert record['framing']['marginPixels'] == 12
assert abs(record['pixelsPerUnit'] - 384 / record['framing']['orthoScale']) < 1e-6
hash_file = lambda path: hashlib.sha256(open(path, 'rb').read()).hexdigest()
primary = os.path.join(ROOT, 'public/game-assets/sound-racer/models', CHARACTER + '-kart-v2.glb')
editable = os.path.join(ROOT, 'source-art/arcade/sound-racer-3d', CHARACTER + '-kart-v2.blend')
assert hash_file(primary) == record['modelSha256'] and hash_file(editable) == record['editableSha256']
recipe = os.path.join(ROOT, 'artwork/games/sound-racer/render_driver_recovery.py')
assert hash_file(recipe) == record['recipeSha256']
retained = os.path.join(os.path.dirname(SOURCE), 'render-driver-source-recipe-v2.py')
shutil.copy2(recipe, retained)
record['sourceRecipe'] = os.path.relpath(retained, ROOT)

sheet = Image.new('RGBA', (1536, 2304))
seen = set()
for frame in record['frames']:
    row, column = states.index(frame['state']), phases.index(frame['phase'])
    assert (row, column) not in seen
    seen.add((row, column))
    path = os.path.join(SOURCE, frame['source'])
    assert hash_file(path) == frame['sha256']
    image = Image.open(path).convert('RGBA')
    assert image.size == (384, 384)
    bounds = image.getchannel('A').getbbox()
    assert bounds and bounds[0] > 0 and bounds[1] > 0 and bounds[2] < 384 and bounds[3] < 384
    assert len(frame['tyreContacts']) == 4 and len(frame['pedalSoles']) == 2
    for contact in [frame['groundAnchor'], *frame['tyreContacts'], *frame['pedalSoles']]:
        assert len(contact) == 2 and all(isinstance(value, (float, int)) and 0 <= value < 384 for value in contact)
    sheet.paste(image, (column * 384, row * 384))
    frame['cell'] = [column * 384, row * 384, 384, 384]
    frame['opaqueBounds'] = bounds

png = os.path.join(os.path.dirname(SOURCE), 'view-' + str(VIEW) + '-sheet-v2.png')
sheet.save(png)
delivery = os.path.join(ROOT, 'public/game-assets/sound-racer/recovery384', CHARACTER)
os.makedirs(delivery, exist_ok=True)
runtime = os.path.join(delivery, 'view-' + str(VIEW) + '-v2.webp')
sheet.save(runtime, 'WEBP', quality=88, method=6, exact=True)
decoded = Image.open(runtime).convert('RGBA')
assert decoded.size == (1536, 2304) and decoded.getchannel('A').getextrema() == (0, 255)
record.update({
    'format': 'driver-384-tight-v2', 'kind': 'driver',
    'sourceSheet': os.path.relpath(png, ROOT), 'sourceSheetSha256': hash_file(png),
    'runtime': '/' + os.path.relpath(runtime, os.path.join(ROOT, 'public')),
    'runtimeBytes': os.path.getsize(runtime), 'runtimeSha256': hash_file(runtime),
    'decodedBytes': 1536 * 2304 * 4,
    'packingRecipe': os.path.relpath(__file__, ROOT), 'packingRecipeSha256': hash_file(__file__),
    'status': 'Complete finite original driver candidate; direct source/native admission pending',
})
open(os.path.join(os.path.dirname(SOURCE), 'view-' + str(VIEW) + '-sheet-v2.json'), 'w').write(json.dumps(record, indent=2) + '\n')
public_keys = ['format', 'kind', 'world', 'character', 'view', 'azimuth', 'cell', 'viewSheet', 'pixelsPerUnit',
               'phases', 'states', 'frames', 'runtime', 'runtimeSha256', 'runtimeBytes', 'modelSha256', 'decodedBytes', 'framing']
open(os.path.join(delivery, 'view-' + str(VIEW) + '-v2.json'), 'w').write(json.dumps({key: record[key] for key in public_keys}, indent=2) + '\n')
print(json.dumps({key: record[key] for key in ['format', 'runtime', 'runtimeBytes', 'runtimeSha256', 'decodedBytes', 'modelSha256', 'sourceSheet']}))
