"""Register original bodies into isolated cells without repainting source pixels.

The generator sometimes paints neighboring poses across nominal row boundaries.
This is lossless body assembly, not a new illustration: originals, component
measurements, offsets and matching anatomical points remain the authority.
"""
from collections import deque
import statistics
from PIL import Image, ImageChops, ImageFilter


def isolate_body(image, window):
    crop = image.crop(window).convert('RGBA')
    alpha = crop.getchannel('A')
    width, height = crop.size
    opaque = bytearray(1 if a >= 192 else 0 for a in alpha.tobytes())
    remaining = opaque.copy()
    bodies = []
    for origin in range(len(remaining)):
        if not remaining[origin]:
            continue
        remaining[origin] = 0
        queue, body = deque([origin]), []
        while queue:
            index = queue.popleft()
            body.append(index)
            x, y = index % width, index // width
            for neighbor in ([index-1] if x else []) + ([index+1] if x+1 < width else []) + ([index-width] if y else []) + ([index+width] if y+1 < height else []):
                if remaining[neighbor]:
                    remaining[neighbor] = 0
                    queue.append(neighbor)
        bodies.append(body)
    body = max(bodies, key=len)
    mask_data = bytearray(len(opaque))
    for index in body:
        mask_data[index] = 255
    mask = Image.frombytes('L', (width, height), bytes(mask_data)).filter(ImageFilter.MaxFilter(5))
    # Keep the original semitransparent antialiasing within two pixels of this
    # body; never admit another pose's opaque toe/comb through the soft margin.
    other = Image.frombytes('L', (width, height), bytes(255 if is_opaque and not mask_data[index] else 0 for index, is_opaque in enumerate(opaque)))
    mask = ImageChops.subtract(mask, other)
    crop.putalpha(ImageChops.multiply(alpha, mask))
    coordinates = [(index % width, index // width) for index in body]
    left, top = min(x for x, _ in coordinates), min(y for _, y in coordinates)
    right, bottom = max(x for x, _ in coordinates)+1, max(y for _, y in coordinates)+1
    baseline = [x for x, y in coordinates if y >= bottom-6]
    metadata = {'bounds': [left, top, right, bottom], 'anchor': [round(statistics.mean(baseline), 3), bottom],
                'bodyOpaquePixels': len(body), 'otherOpaquePixelsExcluded': sum(opaque)-len(body),
                'originalOpaqueBodyPixelsPreserved': True, 'edgeRadius': 2}
    return crop, metadata, body


def pack_actions(image, record, tile=384):
    packed = Image.new('RGBA', (tile*4, tile*4), (0, 0, 0, 0))
    frames, proof = [], []
    source_pixels = image.convert('RGBA')
    for index in range(16):
        window = record['frameWindows'][str(index)]
        crop, measured, body = isolate_body(source_pixels, window)
        if crop.width > tile-12 or crop.height > tile-12:
            raise ValueError(f'Body {index} does not fit its registered cell')
        offset = [index % 4*tile + (tile-crop.width)//2, index//4*tile + tile-20-measured['anchor'][1]]
        packed.paste(crop, tuple(offset))
        sockets = {}
        for limb, point in record['sockets'].get(str(index), {}).items():
            x, y = point[0]-window[0], point[1]-window[1]
            if source_pixels.getpixel(tuple(point))[3] < 192 or crop.getpixel((x, y))[3] < 192:
                raise ValueError(f'Unregistered anatomical point {index} {limb}')
            sockets[limb] = [offset[0]+x, offset[1]+y]
        cell = [offset[0], offset[1], offset[0]+crop.width, offset[1]+crop.height]
        for pixel in body:
            x, y = pixel % crop.width, pixel // crop.width
            if packed.getpixel((offset[0]+x, offset[1]+y)) != source_pixels.getpixel((window[0]+x, window[1]+y)):
                raise ValueError(f'Original body pixel changed: {index} {x},{y}')
        frames.append({'id': index, 'cell': cell, 'anchor': measured['anchor'], 'bounds': measured['bounds'], 'sockets': sockets})
        proof.append({'id': index, 'originalCell': window, 'runtimeOffset': offset, 'sourceToRuntimeTranslation': [offset[0]-window[0], offset[1]-window[1]], **measured})
    return packed, frames, {'method': 'original-connected-body-pixel-assembly', 'alphaThreshold': 192, 'tileSize': tile,
                            'isolatedCells': True, 'originalOpaqueBodyPixelsPreserved': True, 'frames': proof}
