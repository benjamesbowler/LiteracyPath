"""Lossy WebP delivery atlas with lossless alpha; accepts Blender's 24 PNGs."""
from pathlib import Path
import sys
from PIL import Image

folder, output = map(Path, sys.argv[1:])
atlas = Image.new('RGBA', (384 * 4, 384 * 6))
for index in range(24):
    with Image.open(folder / ('frame-%02d.png' % index)) as frame:
        assert frame.size == (384, 384)
        atlas.paste(frame.convert('RGBA'), ((index % 4) * 384, (index // 4) * 384))
atlas.save(output, 'WEBP', quality=88, method=6)
