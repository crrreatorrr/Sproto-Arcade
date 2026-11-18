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
    "require('./boss-sprite-presentations.js');require('./sprotel-art.js');require('./boss-sheets.js');"
    "console.log(JSON.stringify({manifest:ArcadeBossSheets.manifest,versions:ArcadeBossSpriteVersions}));"
)
production = json.loads(subprocess.check_output(['node', '-e', presentation_manifest], cwd=root))
manifest, versions = production['manifest'], production['versions']
errors, pending, records = [], [], []
assert set(map(str, range(1, 13))).issubset(manifest), 'Original boss identities must remain present'
for number, config in manifest.items():
    if config.get('paged'):continue
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
    if config.get('paged'):continue
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
                if cell == 0 and delta.getchannel('A').getbbox() is not None:
                    errors.append(f'{path}: first idle silhouette differs from the canonical pose')
                if not changed or changed[0] < x or changed[1] < y or changed[2] > x+w or changed[3] > y+h:
                    errors.append(f'{path}: cell {cell} is unchanged or modifies pixels outside the draw crop')
        presentation_count += 1
# The new Sprotel identity uses genuine two-by-two mecha pages and separate
# four-by-four projectile atlases. Existing thirteen identities retain their checks.
expected_boss=[['idle','walk','beerThrow','cocktailThrow','marlin','diskLaser'],
               ['idle','beerStick','cocktailCannon','snacks','marlin','diskLaser','soundWave']]
expected_projectiles=['beer','cocktail','blueMarlin','heavyMarlin','diskLaser','speakerMissile','pretzel','nacho','popcorn']
# Preserve reviewed P1 ink only when bytes match its immutable main snapshot.
preserved_snapshot=json.loads((root/'art/reference/20261117-sprotel-bitcoin/preserved-main-a4d85ae/animation-manifest.json').read_text())
preserved_hashes={page.get('sha256',page.get('atlasSha256')) for group in ('animations','projectileAnimations') for animation in preserved_snapshot[group].values() for page in animation['pages']}
paged_count=0
for number,config in manifest.items():
    if not config.get('paged'):continue
    if not config.get('artComplete'):pending.append(number+' paged animation set')
    animations=[]
    for phase,names in enumerate(expected_boss):
        for name in names:
            animation=config.get('phaseAnimations',[{},{}])[phase].get(name)
            if not animation:pending.append(f'{number} P{phase+1} {name}');continue
            animations.append((f'{number} P{phase+1} {name}',animation,2))
    for name in expected_projectiles:
        animation=config.get('projectileAnimations',{}).get(name)
        if not animation:pending.append(f'{number} projectile {name}');continue
        animations.append((f'{number} projectile {name}',animation,animation.get('columns',4)))
    for label,animation,columns in animations:
        try:
            assert animation['frameCount']==16 and len(animation['frames'])==16,'requires sixteen native drawings'
            assert animation['columns']==animation['rows']==columns,'wrong source/runtime grid'
            assert len(animation['pages'])==16//(columns*columns),'wrong page count'
            native_hashes=set();output_hashes=set();frames=[]
            for page_index,page in enumerate(animation['pages']):
                path=root/page['path'];assert path.is_file(),f'missing {path}'
                assert hashlib.sha256(path.read_bytes()).hexdigest()==page['sha256'],'page content hash differs'
                assert page['version']==page['sha256'][:16],'stale content pin'
                preserved_ink=animation.get('preservedFromMain')=='a4d85ae' and page['sha256'] in preserved_hashes
                with Image.open(path) as image:
                    assert image.mode=='RGBA' and image.size==(columns*512,columns*512),'wrong page dimensions or alpha mode'
                    page_boxes=[]
                    for cell in range(columns*columns):
                        frame=image.crop((cell%columns*512,cell//columns*512,(cell%columns+1)*512,(cell//columns+1)*512))
                        frame_index=page_index*columns*columns+cell;record=animation['frames'][frame_index]
                        assert record['index']==frame_index and record['page']==page_index and record['cell']==cell,'frame order differs'
                        alpha=frame.getchannel('A');b=alpha.getbbox();assert b and min(b[:2])>=2 and max(b[2:])<=510,'empty or clipped runtime drawing'
                        assert record['bounds']==[b[0],b[1],b[2]-b[0],b[3]-b[1]],'measured frame bounds differ'
                        digest=hashlib.sha256(frame.tobytes()).hexdigest();assert digest==record['frameSha256'],'frame hash differs'
                        for r,g,blue,a in frame.getdata():
                            assert a in (0,255),'non-crisp alpha'
                            assert a or (r,g,blue)==(0,0,0),'hidden RGB behind transparency'
                            assert preserved_ink or not(a and min(r,blue)>=170 and min(r,blue)-g>=95 and abs(r-blue)<=70),'residual key field'
                        source=root/record['source'];assert source.is_file(),'missing native source'
                        assert hashlib.sha256(source.read_bytes()).hexdigest()==record['sourceSha256'],'source hash differs'
                        with Image.open(source) as original:
                            native=original.convert('RGBA').crop(record['sourceCellXYXY'])
                            assert hashlib.sha256(native.tobytes()).hexdigest()==record['nativeFrameSha256'],'native cell hash differs'
                        native_hashes.add(record['nativeFrameSha256']);output_hashes.add(digest);frames.append(frame);page_boxes.append(b)
                    x=min(b[0] for b in page_boxes);y=min(b[1] for b in page_boxes)
                    assert page['bounds']==[x,y,max(b[2] for b in page_boxes)-x,max(b[3] for b in page_boxes)-y],'page bounds differ'
                paged_count+=1;records.append({'kind':animation['kind'],'label':label,'path':page['path'],'sha256':page['sha256']})
            assert len(native_hashes)==len(output_hashes)==16,'repeated source or runtime drawings'
            core=animation['core'];core_box=(core[0],core[1],core[0]+core[2],core[1]+core[3])
            assert all(frame.crop(core_box).getchannel('A').getextrema()==(255,255) for frame in frames),'core is not opaque in every frame'
            ref=animation['referenceBounds'];b=animation['bounds']
            assert ref[0]<=b[0] and ref[1]<=b[1] and ref[0]+ref[2]>=b[0]+b[2] and ref[1]+ref[3]>=b[1]+b[3],'draw bounds escape reference'
        except (AssertionError,KeyError,OSError,ValueError) as error:errors.append(f'{label}: {error}')

# New attachment and melee numbers must be supported by the actual accepted pixels.
geometry_path=root/'art/generated/bosses/14-sprotel-bitcoin/geometry.json'
if geometry_path.exists():
    geometry=json.loads(geometry_path.read_text())
    for phase,data in geometry.items():
        try:
            config=manifest['14'];idle=config['phaseAnimations'][int(phase)]['idle'];p=data['provenance']
            if int(phase)==0 and p.get('status')=='source-hashed-sprotel-phase1-reviewed':continue
            assert p['idlePageSha256']==[page['sha256'] for page in idle['pages']],'geometry source pins differ'
            lower=p['logicalTargetCorePixels'];rect=(lower[0],lower[1],lower[0]+lower[2],lower[1]+lower[3])
            for page in idle['pages']:
                with Image.open(root/page['path']) as image:
                    for i in range(4):
                        frame=image.crop((i%2*512,i//2*512,(i%2+1)*512,(i//2+1)*512))
                        assert frame.crop(rect).getchannel('A').getextrema()==(255,255),'lower drive core escapes idle opacity'
            if 'beerStickCorePixels' in p:
                impact=json.loads((root/'art/reference/20261117-sprotel-bitcoin/beer-stick-impact.json').read_text())
                assert impact['sourceSha256']==p['beerStickImpactSourceSha256']==hashlib.sha256((root/impact['source']).read_bytes()).hexdigest(),'beer-stick impact source pin differs'
                assert impact['sourceRegionLTRB']==p['beerStickSourceRegion'],'beer-stick impact measurement differs'
                action=config['phaseAnimations'][int(phase)]['beerStick'];index=p['beerStickFrame'];assert index==11,'wrong impact animation frame'
                with Image.open(root/action['pages'][index//4]['path']) as image:
                    frame=image.crop((index%2*512,index%4//2*512,(index%2+1)*512,(index%4//2+1)*512));core=p['beerStickCorePixels']
                    assert frame.crop((core[0],core[1],core[0]+core[2],core[1]+core[3])).getchannel('A').getextrema()==(255,255),'beer stick collider includes unpainted pixels'
        except (AssertionError,KeyError,OSError,ValueError) as error:errors.append(f'14 phase{phase} geometry: {error}')

# Weapon origins are reviewed points on the exact release cells, independent of colliders.
try:
    attachments=json.loads((root/'art/reference/20261117-sprotel-bitcoin/projectile-attachments.json').read_text())
    assert attachments['schemaVersion']==1,'unsupported attachment schema'
    for phase,actions in attachments['phases'].items():
        assert geometry[phase]['provenance']['projectileAttachments']==actions,'runtime attachment measurements differ'
        for action,spec in actions.items():
            animation=manifest['14']['phaseAnimations'][int(phase)][action];page=spec['page']
            actual=animation['pages'][page['firstFrame']//4]
            assert page['path']==actual['path'] and page['sha256']==actual['sha256'],'attachment release page pin differs'
            assert spec['referenceBounds']==animation['referenceBounds'] and page['crop']==actual['bounds'],'attachment registration differs'
            assert spec['renderCrop']==(animation['bounds'] if animation.get('preservedFromMain') else actual['bounds']),'attachment render crop differs'
            with Image.open(root/page['path']) as image:
                for port in spec['ports'].values():
                    for frame,point in port['frames'].items():
                        local=int(frame)-page['firstFrame'];assert 0<=local<4,'attachment is outside release page'
                        x,y=point;assert 0<=x<512 and 0<=y<512,'attachment leaves native cell'
                        assert image.getpixel((local%2*512+round(x),local//2*512+round(y)))[3]>0,'attachment is not on the visible weapon'
except (AssertionError,KeyError,OSError,ValueError) as error:errors.append(f'14 projectile attachments: {error}')

if args.require_complete and pending:
    errors.extend(f'Pending: {label}' for label in pending)
print(json.dumps({'approvedFiles': len(records), 'expectedFiles': 52+76,
                  'presentationFiles': presentation_count,'pagedAnimationFiles':paged_count, 'pending': pending, 'errors': errors, 'assets': records}, indent=2))
raise SystemExit(1 if errors else 0)
