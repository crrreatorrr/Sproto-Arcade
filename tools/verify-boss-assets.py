#!/usr/bin/env python3
"""Verify the actual enabled boss/projectile pixels for every phase.

Run with --require-complete before releasing the complete configured boss art set.
Requires Pillow and Node. This reads the production manifest without a browser.
"""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

from PIL import Image, ImageChops

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--require-complete', action='store_true')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
presentation_manifest = (
    "require('./boss-sprite-presentations.js');require('./boss-sheets.js');"
    "console.log(JSON.stringify({manifest:ArcadeBossSheets.manifest,versions:ArcadeBossSpriteVersions}));"
)
production = json.loads(subprocess.check_output(['node', '-e', presentation_manifest], cwd=root))
manifest, versions = production['manifest'], production['versions']
errors, pending, records = [], [], []
assert set(map(str, range(1, 13))).issubset(manifest), 'Original boss identities must remain present'
for number, config in manifest.items():
    for group in ['phases', 'projectiles']:
        assert len(config[group]) == 2
        for phase, asset in enumerate(config[group], 1):
            label = f'{number} {config["folder"]} P{phase} {group}'
            if not asset.get('ready'):
                pending.append(label)
                continue
            path = root / asset['path']
            if not path.exists():
                errors.append(f'{label}: missing enabled file {path}')
                continue
            image = Image.open(path)
            if image.mode != 'RGBA' or image.size != (2048, 2048):
                errors.append(f'{label}: expected RGBA 2048×2048, got {image.mode} {image.size}')
                continue
            bounds = []
            for row in range(4):
                for col in range(4):
                    cell = image.crop((col*512, row*512, (col+1)*512, (row+1)*512))
                    box = cell.getchannel('A').getbbox()
                    if box is None:
                        errors.append(f'{label}: empty row {row+1} column {col+1}')
                    elif min(box[:2]) < 2 or max(box[2:]) > 510:
                        errors.append(f'{label}: cell boundary clipping at row {row+1} column {col+1}: {box}')
                    bounds.append(box)
            if all(bounds):
                def union(boxes):
                    left, top = min(b[0] for b in boxes), min(b[1] for b in boxes)
                    return [left, top, max(b[2] for b in boxes)-left, max(b[3] for b in boxes)-top]
                actual = union(bounds)
                if actual != asset.get('bounds'):
                    errors.append(f'{label}: manifest bounds {asset.get("bounds")} differ from actual {actual}')
                rows = [union(bounds[r*4:r*4+4]) for r in range(4)]
                if asset.get('rowBounds') is not None and rows != asset['rowBounds']:
                    errors.append(f'{label}: projectile rowBounds differ from actual {rows}')
            if not path.with_suffix('.json').exists():
                errors.append(f'{label}: missing conversion provenance JSON')
            records.append({'phase': phase, 'kind': group, 'folder': config['folder'],
                            'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
presentation_count = 0
for number, config in manifest.items():
    pins = versions.get(number)
    if not pins or len(pins) != 2:
        errors.append(f'{number}: expected two cosmetic sprite sheets')
        continue
    for phase, (asset, pin) in enumerate(zip(config['phases'], pins), 1):
        canonical = root / asset['path']
        path = canonical.with_name(f'p{phase}-presentation.webp')
        if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest()[:12] != pin:
            errors.append(f'{path}: missing or does not match its content pin')
            continue
        with Image.open(path) as image, Image.open(canonical) as source:
            if image.mode != 'RGBA' or image.size != (2048, 2048):
                errors.append(f'{path}: expected a transparent 2048×2048 atlas')
                continue
            x, y, w, h = asset['bounds']
            for cell in range(16):
                col, row = cell % 4 * 512, cell // 4 * 512
                region = (col, row, col + 512, row + 512)
                active = image.crop(region)
                original = source.crop(region)
                alpha = active.getchannel('A')
                if alpha.getbbox() is None:
                    errors.append(f'{path}: empty cell {cell}')
                    continue
                delta = ImageChops.difference(active, original)
                rgb = delta.convert('RGB').point(lambda value: 255 if value else 0).convert('L')
                coverage = ImageChops.lighter(alpha, original.getchannel('A')).point(lambda value: 255 if value else 0)
                changed = ImageChops.lighter(delta.getchannel('A'), ImageChops.multiply(rgb, coverage)).getbbox()
                if cell == 0 and changed is not None:
                    errors.append(f'{path}: first idle pose does not match the transition')
                elif cell and (not changed or changed[0] < x or changed[1] < y or changed[2] > x+w or changed[3] > y+h):
                    errors.append(f'{path}: cell {cell} is unchanged or modifies pixels outside the draw crop')
        presentation_count += 1
if args.require_complete and pending:
    errors.extend(f'Pending: {label}' for label in pending)
print(json.dumps({'approvedFiles': len(records), 'expectedFiles': len(manifest)*4,
                  'presentationFiles': presentation_count, 'pending': pending, 'errors': errors, 'assets': records}, indent=2))
raise SystemExit(1 if errors else 0)
