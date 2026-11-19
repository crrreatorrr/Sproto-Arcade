#!/usr/bin/env python3
"""Writes a lossless WebP copy of every reviewed boss projectile atlas (pN-projectiles.png).

    python3 tools/make-projectile-presentations.py          write missing/stale copies and pins
    python3 tools/make-projectile-presentations.py --check  fail unless every copy decodes to the
                                                            exact RGBA pixels of its PNG

The PNG stays the reviewed, source-hashed record (SPRITE_HITBOXES provenance pins it). The game
draws pN-projectiles-presentation.webp, which decodes to byte-identical RGBA, so collision and
visuals are unchanged. Pins (first 12 hex of the WebP sha256) go in boss-sprite-presentations.js
as globalThis.ArcadeBossProjectileVersions.
"""
import hashlib, json, re, subprocess, sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PINS = ROOT / 'boss-sprite-presentations.js'
BEGIN, END = '// BEGIN PROJECTILE PRESENTATIONS', '// END PROJECTILE PRESENTATIONS'


def projectile_assets():
    script = ("const fs=require('fs'),vm=require('vm');const c={};c.globalThis=c;"
              "for(const f of ['boss-sprite-presentations.js','sprotel-art.js','boss-sheets.js'])vm.runInNewContext(fs.readFileSync(f,'utf8'),c);"
              "const m=c.ArcadeBossSheets.manifest;console.log(JSON.stringify(Object.fromEntries(Object.entries(m)"
              ".filter(([,v])=>!v.paged).map(([k,v])=>[k,v.projectiles.map(p=>p.ready?p.path:null)]))));")
    return json.loads(subprocess.check_output(['node', '-e', script], cwd=ROOT))


def identical(png, webp):
    with Image.open(png) as a, Image.open(webp) as b:
        return a.size == b.size and a.convert('RGBA').tobytes() == b.convert('RGBA').tobytes()


def main(check):
    pins, errors = {}, []
    for stage, paths in sorted(projectile_assets().items(), key=lambda kv: int(kv[0])):
        row = []
        for rel in paths:
            if not rel:
                row.append(None)
                continue
            png = ROOT / rel
            webp = png.with_name(png.stem + '-presentation.webp')
            if not check and (not webp.exists() or not identical(png, webp)):
                with Image.open(png) as im:
                    im.convert('RGBA').save(webp, 'WEBP', lossless=True, exact=True, method=5)
            if not webp.exists() or not identical(png, webp):
                errors.append(f'{webp.relative_to(ROOT)}: missing or not pixel-identical to {rel}')
                row.append(None)
                continue
            row.append(hashlib.sha256(webp.read_bytes()).hexdigest()[:12])
        pins[stage] = row
    body = BEGIN + '\n// Lossless copies of the reviewed projectile atlases (tools/make-projectile-presentations.py).\n' \
        'globalThis.ArcadeBossProjectileVersions = {\n' + ''.join(
            f'  {k}:{json.dumps(v)},\n' for k, v in pins.items()) + '};\n' + END
    text = PINS.read_text()
    current = re.search(re.escape(BEGIN) + r'.*?' + re.escape(END), text, re.S)
    if check:
        if not current or current.group(0) != body:
            errors.append('boss-sprite-presentations.js projectile pins are stale')
    else:
        text = text.replace(current.group(0), body) if current else text.rstrip('\n') + '\n' + body + '\n'
        PINS.write_text(text)
    print(json.dumps({'status': 'failed' if errors else 'passed', 'kind': 'projectile-presentations',
                      'sheets': sum(1 for r in pins.values() for p in r if p), 'errors': errors}))
    return 1 if errors else 0


if __name__ == '__main__':
    sys.exit(main('--check' in sys.argv))
