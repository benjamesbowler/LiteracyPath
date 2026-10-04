"""Encode retained originals and measure the real alpha bodies; no painted pixels are edited."""
from collections import deque
from pathlib import Path
import hashlib
import json
import statistics
import sys

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'source-art/arcade/physical-worlds/sound-beat'
RUNTIME = ROOT / 'public/game-assets/physical-arcade/sound-beat'


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def largest_body(mask):
    visited = np.zeros(mask.shape, dtype=bool)
    largest = []
    for yy, xx in zip(*np.where(mask)):
        if visited[yy, xx]:
            continue
        queue = deque([(int(xx), int(yy))])
        visited[yy, xx] = True
        points = []
        while queue:
            x, y = queue.popleft()
            points.append((x, y))
            for dx, dy in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < mask.shape[1] and 0 <= ny < mask.shape[0] and mask[ny, nx] and not visited[ny, nx]:
                    visited[ny, nx] = True
                    queue.append((nx, ny))
        if len(points) > len(largest):
            largest = points
    return largest


def measured_frames(image, columns, rows, hands=None):
    alpha = np.asarray(image.getchannel('A'))
    frames = []
    for index in range(columns * rows):
        column, row = index % columns, index // columns
        grid = [round(column * image.width / columns), round(row * image.height / rows), round((column + 1) * image.width / columns), round((row + 1) * image.height / rows)]
        x0, y0, x1, y1 = grid
        # Measurement threshold excludes soft alpha/fringe from geometry only.
        # Original and runtime pixel alpha remain untouched.
        points = largest_body(alpha[y0:y1, x0:x1] >= 192)
        if not points:
            raise ValueError(f'Empty body in cell {index}')
        xs, ys = zip(*points)
        body = [x0 + min(xs), y0 + min(ys), x0 + max(xs) + 1, y0 + max(ys) + 1]
        cell = [max(x0, body[0] - 3), max(y0, body[1] - 3), min(x1, body[2] + 3), min(y1, body[3] + 3)]
        feet = [(x + x0, y + y0) for x, y in points if y + y0 >= body[3] - 7]
        anchor_x = statistics.mean(x for x, _ in feet)
        frame = {'id': index, 'row': row, 'column': column, 'cell': cell,
                 'bounds': [body[0] - cell[0], body[1] - cell[1], body[2] - cell[0], body[3] - cell[1]],
                 'anchor': [round(anchor_x - cell[0], 3), body[3] - cell[1]], 'mirror': False}
        if hands is not None:
            if str(index) in hands:
                frame.update(hands[str(index)])
                sockets = frame.get('sockets', {}) or {name: frame[name] for name in ['leftHandPixel', 'rightHandPixel']}
                for hand, (x, y) in sockets.items():
                    if not (cell[0] <= x < cell[2] and cell[1] <= y < cell[3] and alpha[y, x] >= 192):
                        raise ValueError(f'Unregistered/nonopaque {hand} in {index}: {x}, {y}')
            else:
                frame['excluded'] = 'Not a reviewed musical contact pose; never selected at runtime.'
        frames.append(frame)
    return frames


def main():
    # A provenance correction can rebuild metadata without touching retained
    # pixels, measured contacts, encoding or their delivery hashes.
    if '--metadata-only' in sys.argv:
        manifest_path = SOURCE / 'scene-kit-v1.json'
        manifest = json.loads(manifest_path.read_text())
        for asset in manifest['assets'].values():
            asset['creator'] = 'OpenAI built-in image generation, authored for Literacy Guide'
        manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
        runtime_assets = {name: asset for name, asset in manifest['assets'].items() if not asset.get('sourceOnly')}
        destination = ROOT / 'src/components/learn/games/games/soundBeatArtData.js'
        destination.write_text('// Generated from original alpha/hand registrations by scripts/generate-sound-beat-art.py.\nexport const SOUND_BEAT_ART = ' + json.dumps(runtime_assets, indent=2) + ';\n')
        print('Refreshed source/runtime metadata; pixels, hashes and registration unchanged.')
        return
    global np
    import numpy as np
    from PIL import Image
    RUNTIME.mkdir(parents=True, exist_ok=True)
    registration_path = SOURCE / 'hand-registration-v1.json'
    registrations = json.loads(registration_path.read_text()) if registration_path.exists() else {}
    assets = {}
    prompts = {record['id']: record for record in json.loads((SOURCE / 'prompts-v1.json').read_text())}
    for path in sorted(SOURCE.glob('*-v1.png')):
        image = Image.open(path).convert('RGBA')
        output = RUNTIME / (path.stem + '.webp')
        source_only = path.stem in ['bouncy-music-actions-v1', 'woolly-music-actions-v1']
        if not source_only:
            image.save(output, 'WEBP', quality=90, method=6, exact=True)
        asset = {'source': str(path.relative_to(ROOT)), 'runtime': None if source_only else '/game-assets/physical-arcade/sound-beat/' + output.name,
                 'width': image.width, 'height': image.height, 'sourceBytes': path.stat().st_size,
                 'runtimeBytes': None if source_only else output.stat().st_size, 'sourceSha256': sha256(path), 'runtimeSha256': None if source_only else sha256(output),
                 'alphaPixels': int((np.asarray(image.getchannel('A')) < 255).sum()),
                 'creator': 'OpenAI built-in image generation, authored for Literacy Guide',
                 'rights': 'Original generated project art; no downloaded third-party asset',
                 'originalOutput': prompts[path.stem]['output'],
                 'references': [{'path': reference, 'sha256': sha256(ROOT / reference)} for reference in prompts[path.stem]['references']]}
        if source_only:
            asset.update({'role': 'retained-original-performance-authoring-reference', 'sourceOnly': True,
                          'replacedBy': path.stem.replace('-actions-', '-performance-')})
        if 'music-' in path.name:
            asset['frames'] = measured_frames(image, 4, 4, registrations.get(path.stem, {}))
            asset['nominalHeight'] = 2.2
            asset['pixelsPerUnit'] = statistics.median(frame['bounds'][3] - frame['bounds'][1] for frame in asset['frames']) / 2.2
        elif path.stem == 'instrument-kit-v1':
            asset['frames'] = measured_frames(image, 4, 3)
        assets[path.stem] = asset
        print(path.name, image.size, 'source reference only' if source_only else output.stat().st_size)
    manifest = {'schemaVersion': 1, 'game': 'sound-beat', 'generatedBy': 'scripts/generate-sound-beat-art.py',
                'registration': 'hand-registration-v1.json', 'prompts': 'prompts-v1.json',
                'review': json.loads((SOURCE / 'review-v1.json').read_text()),
                'assets': assets}
    (SOURCE / 'scene-kit-v1.json').write_text(json.dumps(manifest, indent=2) + '\n')
    destination = ROOT / 'src/components/learn/games/games/soundBeatArtData.js'
    runtime_assets = {name: asset for name, asset in assets.items() if not asset.get('sourceOnly')}
    destination.write_text('// Generated from original alpha/hand registrations by scripts/generate-sound-beat-art.py.\nexport const SOUND_BEAT_ART = ' + json.dumps(runtime_assets, indent=2) + ';\n')


if __name__ == '__main__':
    main()
