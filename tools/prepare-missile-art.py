#!/usr/bin/env python3
"""Export the supplied static missile without redrawing it (requires Pillow)."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('source', type=Path)
parser.add_argument('--output', type=Path, default=Path(__file__).resolve().parents[1] / 'art/gameplay/projectiles')
args = parser.parse_args()
source = Image.open(args.source).convert('RGB')
if source.size != (2048, 1152):
    raise SystemExit('Expected the reviewed 2048×1152 source')
# Remove only exterior-connected magenta. Interior red/pink paint stays opaque.
key = Image.new('L', source.size)
key.putdata([255 if r > 55 and r-g > 25 and b-g > 20 else 0 for r,g,b in source.getdata()])
ImageDraw.floodfill(key, (0, 0), 128)
rgba = source.convert('RGBA')
rgba.putalpha(key.point(lambda value: 0 if value == 128 else 255))
bounds = rgba.getbbox()
master = rgba.crop(bounds)
master.putdata([(r,g,b,a) if a else (0,0,0,0) for r,g,b,a in master.getdata()])
# Preserve the tight source aspect ratio; pad the existing 44×18 collision frame.
nearest = Image.Resampling.NEAREST if hasattr(Image, 'Resampling') else Image.NEAREST
body = master.resize((44, 12), nearest)
frame = Image.new('RGBA', (44, 18))
frame.alpha_composite(body, (0, 3))
args.output.mkdir(parents=True, exist_ok=True)
master.save(args.output / 'missile-master.png')
frame.resize((176,72), nearest).save(args.output / 'missile.png')
print(json.dumps({'sourceSha256': hashlib.sha256(args.source.read_bytes()).hexdigest(), 'sourceCrop': bounds, 'masterSize': master.size, 'runtimeSize': [176,72], 'logicalBody': [0,3,44,12], 'logicalFrame': [44,18]}))
