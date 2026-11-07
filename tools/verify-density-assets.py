#!/usr/bin/env python3
"""Read-only checks of the actual configured missile/pickup PNGs and numeric cores.

Pending assets are reported while their corresponding feature is disabled.
--require-complete requires all13 missile entries plus accepted pickup artwork.
No runtime readiness, geometry, provenance or files are modified.
"""
import argparse, hashlib, json, math, subprocess
from pathlib import Path
from PIL import Image, ImageChops
ROOT=Path(__file__).resolve().parents[1]
CELL=512
ACCEPTED_STATUSES={'accepted','accepted-active','root-visual-reviewed-active','root-visual-reviewed-accepted'}


def digest(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def valid_rect(r):return isinstance(r,list) and len(r)==4 and all(isinstance(v,int) and not isinstance(v,bool) for v in r) and min(r[:2])>=0 and min(r[2:])>0 and r[0]+r[2]<=CELL and r[1]+r[3]<=CELL

def union(boxes):
    x=min(b[0] for b in boxes);y=min(b[1] for b in boxes)
    return[x,y,max(b[2] for b in boxes)-x,max(b[3] for b in boxes)-y]

def finite_angle(value):return isinstance(value,(int,float)) and not isinstance(value,bool) and math.isfinite(value)
def finite_box(value):return isinstance(value,list) and len(value)==4 and all(finite_angle(v) for v in value) and min(value[2:])>0
def trig(rotation):return (-math.sqrt(.5),-math.sqrt(.5)) if abs(rotation+3*math.pi/4)<1e-12 else (math.cos(rotation),math.sin(rotation))
def equal_numbers(a,b):return len(a)==len(b) and all(math.isclose(x,y,rel_tol=1e-10,abs_tol=1e-8) for x,y in zip(a,b))

def rotated_alpha_bounds(image,bounds,rotation):
    """Rotate actual positive-alpha pixel CORNERS, not the alpha crop AABB.

    Row endpoints give exact affine extrema even when the row has holes; each
    selected corner belongs to its first/last actual positive-alpha pixel.
    """
    alpha=Image.new('L',(CELL,CELL))
    for col in range(4):alpha=ImageChops.lighter(alpha,image.crop((col*CELL,0,(col+1)*CELL,CELL)).getchannel('A'))
    cx=bounds[0]+bounds[2]/2;cy=bounds[1]+bounds[3]/2;cos,sin=trig(rotation);points=[]
    for y in range(CELL):
        row=alpha.crop((0,y,CELL,y+1)).getbbox()
        if row:
            for x in [row[0],row[2]]:
                for yy in [y,y+1]:
                    dx=x-cx;dy=yy-cy;points.append((dx*cos-dy*sin,dx*sin+dy*cos))
    left=min(p[0] for p in points);top=min(p[1] for p in points)
    return[left,top,max(p[0] for p in points)-left,max(p[1] for p in points)-top]

def verify_orientation(image,bounds,geometry,meta,asset,probes=None):
    rotation=geometry.get('rotation',0)
    if not finite_angle(rotation):raise ValueError('geometry rotation must be finite radians')
    expected_matrix=trig(rotation)
    for name,data in [('metadata',meta),('renderer',asset)]:
        if 'rotation' in data and (not finite_angle(data['rotation']) or not math.isclose(data['rotation'],rotation,abs_tol=1e-12)):raise ValueError(f'{name} rotation differs from finite numeric geometry angle')
    oriented=rotated_alpha_bounds(image,bounds,rotation)
    for name,data in [('geometry',geometry),('metadata',meta),('renderer',asset)]:
        if rotation and name!='renderer' and ('rotation' not in data or 'orientedBounds' not in data):raise ValueError(f'{name} rotated missile requires angle and actual-pixel orientedBounds')
        if rotation and name!='renderer' and 'rotationMatrix' not in data:raise ValueError(f'{name} rotated missile requires pinned numeric rotationMatrix')
        if 'rotationMatrix' in data:
            matrix=data['rotationMatrix']
            if not isinstance(matrix,list) or len(matrix)!=2 or not all(finite_angle(v) for v in matrix) or not math.isclose(sum(v*v for v in matrix),1,abs_tol=1e-9) or not all(math.isclose(v,e,abs_tol=1e-9) for v,e in zip(matrix,expected_matrix)):raise ValueError(f'{name} rotationMatrix must be finite orthonormal and match source angle')
        if 'orientedBounds' in data and (not finite_box(data['orientedBounds']) or not equal_numbers(data['orientedBounds'],oriented)):raise ValueError(f'{name} orientedBounds differ from rotated actual opaque-pixel corners')
    if probes is not None:
        if not isinstance(probes,list) or len(probes)!=2:raise ValueError('missing actual runtime damage-core probes')
        C=geometry['core'];scale=min(64/oriented[2],64/oriented[3]) if rotation else min(64/bounds[2],64/bounds[3]);cos,sin=trig(rotation)
        ox=oriented[0]+oriented[2]/2 if rotation else 0;oy=oriented[1]+oriented[3]/2 if rotation else 0
        dx=C[0]+C[2]/2-bounds[0]-bounds[2]/2;dy=C[1]+C[3]/2-bounds[1]-bounds[3]/2
        w=h=min(C[2],C[3])*scale/math.sqrt(2) if rotation else None
        if not rotation:w=C[2]*scale;h=C[3]*scale
        for vx,probe in zip([-1,1],probes):
            centerX=155+(dx*cos-dy*sin-ox)*scale*(1 if vx<0 else -1);centerY=266+(dx*sin+dy*cos-oy)*scale
            expected=[centerX-w/2,centerY-h/2,w,h]
            if not isinstance(probe,dict) or not all(finite_angle(probe.get(k)) for k in ['x','y','w','h']) or not equal_numbers([probe[k] for k in ['x','y','w','h']],expected):raise ValueError('actual runtime damage core differs from conservative rotated inscribed square/both-direction transform')
    return rotation,oriented

def metadata(path,image):
    meta=json.loads(path.with_suffix('.json').read_text());actual=digest(path)
    if not isinstance(meta,dict):raise ValueError('asset metadata must be an object')
    if meta.get('outputSha256')!=actual:raise ValueError('metadata outputSha256 differs from actual loaded PNG')
    if meta.get('outputSize')!=list(image.size):raise ValueError('metadata outputSize differs from actual PNG')
    if meta.get('status') not in ACCEPTED_STATUSES:raise ValueError('ready asset metadata has no accepted/root-reviewed status')
    if not isinstance(meta.get('sourceSha256'),str) or len(meta['sourceSha256'])!=64 or any(c not in '0123456789abcdef' for c in meta['sourceSha256']):raise ValueError('missing valid original-source provenance hash')
    if meta.get('sourceSize')!=[2048,2048]:raise ValueError('expected genuine2048x2048 original-source provenance')
    original=Path(meta['sourceFile']) if meta.get('sourceFile') else None
    if original and original.is_file() and digest(original)!=meta['sourceSha256']:raise ValueError('available original source differs from provenance hash')
    for field in ['edgeUnmix','isolatedBackgroundRemoval']:
        if field in meta and not isinstance(meta[field],dict):raise ValueError(f'{field} provenance must be an object')
    masks=[(field,meta.get(field),suffix,(512,512) if field=='commonOpaqueMaskSha256' else image.size) for field,suffix in [('keyMaskSha256','.key-mask.png'),('commonOpaqueMaskSha256','.common-opaque.png')]]
    masks.extend((field,meta.get(field,{}).get('maskSha256'),suffix,image.size) for field,suffix in [('edgeUnmix','.edge-unmix-mask.png'),('isolatedBackgroundRemoval','.isolated-background-mask.png')])
    for field,expected,suffix,size in masks:
        if field in meta:
            sidecar=path.with_suffix(suffix)
            if not expected or not sidecar.is_file() or digest(sidecar)!=expected:raise ValueError(f'{field} differs from actual preservation-mask sidecar')
            with Image.open(sidecar) as mask:
                if mask.mode!='L' or mask.size!=size:raise ValueError(f'{field} preservation mask must be L mode with dimensions{size}')
    return meta,actual

def frame_boxes(image,rows):
    result=[]
    for row in range(rows):
        boxes=[]
        for col in range(4):
            b=image.crop((col*CELL,row*CELL,(col+1)*CELL,(row+1)*CELL)).getchannel('A').getbbox()
            if b is None or min(b[:2])<2 or max(b[2:])>CELL-2:raise ValueError(f'row{row} column{col}: empty/clipped cell or <2px alpha margin: {b}')
            boxes.append(list(b))
        result.append(boxes)
    return result

def verify_missile(path,asset,geometry,probes=None):
    with Image.open(path) as im:
        if im.mode!='RGBA' or im.size!=(2048,512):raise ValueError('missile PNG must be native2048x512 RGBA strip')
        im.load();meta,actual=metadata(path,im);boxes=frame_boxes(im,1)[0];bounds=union(boxes)
        if not geometry:raise ValueError('ready missile has no numeric geometry')
        if geometry.get('sourceSha256')!=actual:raise ValueError('geometry sourceSha256 differs from actual loaded strip PNG')
        if not valid_rect(geometry.get('bounds')) or geometry['bounds']!=bounds:raise ValueError('geometry bounds differ from actual four-frame alpha union')
        if meta.get('bounds')!=bounds:raise ValueError('metadata bounds differ from actual four-frame alpha union')
        if asset.get('bounds') is not None and asset['bounds']!=bounds:raise ValueError('renderer bounds differ from measured geometry/PNG')
        core=geometry.get('core')
        if not valid_rect(core):raise ValueError('invalid finite integer core rectangle')
        x,y,w,h=core;bx,by,bw,bh=bounds
        if x<bx or y<by or x+w>bx+bw or y+h>by+bh:raise ValueError('numeric core lies outside actual alpha union')
        if meta.get('core')!=core:raise ValueError('metadata core differs from numeric runtime core')
        for col in range(4):
            alpha=im.crop((col*CELL+x,y,col*CELL+x+w,y+h)).getchannel('A')
            if alpha.getextrema()!=(255,255):raise ValueError(f'core includes transparent/nonopaque pixels in frame{col}')
        if meta.get('frameBounds')!=boxes:raise ValueError('metadata frameBounds differ from actual cells')
        rotation,oriented=verify_orientation(im,bounds,geometry,meta,asset,probes)
        return {'path':str(path.relative_to(ROOT)) if path.is_relative_to(ROOT) else str(path),'sha256':actual,'bounds':bounds,'core':core,'rotation':rotation,'orientedBounds':oriented,'frames':4}

def verify_pickups(path,asset):
    with Image.open(path) as im:
        if im.mode!='RGBA' or im.size!=(2048,2048):raise ValueError('pickup PNG must be native2048x2048 RGBA atlas')
        im.load();meta,actual=metadata(path,im);boxes=frame_boxes(im,4);rows=[union(row) for row in boxes]
        if asset.get('rowBounds')!=rows or meta.get('rowBounds')!=rows:raise ValueError('pickup renderer/metadata rowBounds differ from actual alpha unions')
        if meta.get('frameBounds')!=boxes:raise ValueError('pickup metadata frameBounds differ from actual cells')
        for row in [2,3]:
            for col in range(4):
                if im.getpixel((col*CELL+CELL//2,row*CELL+CELL//2))[3]!=0:raise ValueError(f'shield ring center is not transparent row{row} column{col}')
        return {'path':str(path.relative_to(ROOT)) if path.is_relative_to(ROOT) else str(path),'sha256':actual,'rowBounds':rows,'hollowShieldFrames':8}

def load_config(root):
    script="""const fs=require('fs'),vm=require('vm');const c=vm.createContext({});for(const f of ['density-attacks.js','phase-powerups.js','boss-sheets.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});const D=c.ArcadeDensityAttacks;const probes=Object.fromEntries(Object.keys(D.missileGeometry).map(stage=>[stage,[-1,1].map(vx=>D.damageRect({stage,x:123,y:234,w:64,h:64,vx}))]));console.log(JSON.stringify({missiles:c.ArcadeBossSheets.missileAssets,pickups:c.ArcadeBossSheets.pickupAsset,density:D.enabled,items:c.ArcadePhasePowerups.assetsReady,geometry:D.missileGeometry,probes}));"""
    return json.loads(subprocess.check_output(['node','-e',script],cwd=root))

def verify(root,config,require_complete=False):
    errors=[];pending=[];missiles=[];pickup=None
    expected={str(i) for i in range(1,14)}
    if set(config['missiles'])!=expected:errors.append('configured missile entries must preserve all stable IDs1..13')
    for stage,asset in sorted(config['missiles'].items(),key=lambda item:int(item[0])):
        if not asset.get('ready'):
            pending.append(f'missile{stage}')
            if config['density']:errors.append(f'missile{stage}: feature enabled while asset is pending')
            continue
        try:missiles.append({'stage':int(stage),**verify_missile(root/asset['path'],asset,config['geometry'].get(stage),config.get('probes',{}).get(stage) if 'probes' in config else None)})
        except (ValueError,OSError,KeyError,TypeError) as e:errors.append(f'missile{stage}: {e}')
    asset=config['pickups']
    if not asset.get('ready'):
        pending.append('pickups')
        if config['items']:errors.append('pickup feature enabled while asset is pending')
    else:
        try:pickup=verify_pickups(root/asset['path'],asset)
        except (ValueError,OSError,KeyError,TypeError) as e:errors.append(f'pickups: {e}')
    if config['density'] and len(missiles)!=13:errors.append('enabled density requires all13 accepted source-hashed numeric missile cores')
    if config['items'] and pickup is None:errors.append('enabled random items require accepted pickup/shield atlas')
    if require_complete and pending:errors.append('require-complete: pending assets remain')
    return {'status':'failed' if errors else 'passed','kind':'actual-density-powerup-assets','densityEnabled':config['density'],'powerupsEnabled':config['items'],'configuredMissiles':len(config['missiles']),'verifiedMissiles':missiles,'verifiedPickups':pickup,'pending':pending,'errors':errors,'limitations':['Accepted-status metadata and core overlays require prior visual review; this checks hashes, actual pixels and runtime configuration.','This verifier never enables art or gameplay.']}

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--require-complete',action='store_true');a=p.parse_args()
    try:report=verify(ROOT,load_config(ROOT),a.require_complete)
    except (OSError,ValueError,subprocess.CalledProcessError) as e:report={'status':'failed','errors':[str(e)]}
    print(json.dumps(report,indent=2));return 1 if report['status']=='failed' else 0
if __name__=='__main__':raise SystemExit(main())
