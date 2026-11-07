#!/usr/bin/env python3
"""Synthetic malformed-file tests for the read-only production verifier."""
import copy, hashlib, importlib.util, json, tempfile, math, subprocess
from pathlib import Path
from PIL import Image, ImageDraw
spec=importlib.util.spec_from_file_location('density_verifier',Path(__file__).resolve().parents[1]/'tools/verify-density-assets.py');v=importlib.util.module_from_spec(spec);spec.loader.exec_module(v)
def hashed(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def meta(path,image,bounds,frames,**extra):
    data={'status':'root-visual-reviewed-active','sourceSha256':'0'*64,'sourceSize':[2048,2048],'outputSha256':hashed(path),'outputSize':list(image.size),'bounds':bounds,'frameBounds':frames,**extra};path.with_suffix('.json').write_text(json.dumps(data));return data
with tempfile.TemporaryDirectory(prefix='density-verifier-') as folder:
    root=Path(folder);p=root/'missile.png';image=Image.new('RGBA',(2048,512));d=ImageDraw.Draw(image)
    for col in range(4):d.rectangle((col*512+100,200,col*512+299,299),fill=(220,50,40,255))
    image.save(p);g={'sourceSha256':hashed(p),'bounds':[100,200,200,100],'core':[140,220,60,40]};metadata=meta(p,image,g['bounds'],[[100,200,300,300]]*4,core=g['core']);asset={'ready':True,'path':'missile.png','bounds':g['bounds']};v.verify_missile(p,asset,g)
    for field,value,match in [('sourceSha256','f'*64,'sourceSha256'),('bounds',[0,0,512,512],'bounds'),('core',[90,210,100,50],'outside'),('core',[140,220,float('nan'),40],'invalid')]:
        bad={**g,field:value}
        try:v.verify_missile(p,asset,bad);raise AssertionError('bad geometry accepted')
        except ValueError as e:assert match in str(e),(match,str(e))
    # Oblique triangular sources distinguish actual-pixel corner bounds from a
    # rotated rectangular crop. Exercise the real JS damageRect in both directions.
    original_png=p.read_bytes();original_meta=p.with_suffix('.json').read_bytes()
    oblique=Image.new('RGBA',(2048,512));od=ImageDraw.Draw(oblique)
    for col in range(4):od.polygon([(col*512+100,100),(col*512+400,400),(col*512+100,400)],fill=(220,50,40,255))
    oblique.save(p);angle=-3*math.pi/4;native=[100,100,301,301];oriented=v.rotated_alpha_bounds(oblique,native,angle);rotated={'sourceSha256':hashed(p),'bounds':native,'core':[130,300,40,40],'rotation':angle,'rotationMatrix':list(v.trig(angle)),'orientedBounds':oriented}
    meta(p,oblique,native,[[100,100,401,401]]*4,core=rotated['core'],rotation=angle,rotationMatrix=rotated['rotationMatrix'],orientedBounds=oriented)
    script="require('./density-attacks.js');const D=ArcadeDensityAttacks;D.missileGeometry[11]=JSON.parse(process.argv[1]);console.log(JSON.stringify([-1,1].map(vx=>D.damageRect({stage:11,x:123,y:234,w:64,h:64,vx}))));"
    probes=json.loads(subprocess.check_output(['node','-e',script,json.dumps(rotated)],cwd=v.ROOT));v.verify_missile(p,{'bounds':native},rotated,probes)
    assert min(oriented[2:])<max(oriented[2:])*.7,'true triangle oriented bounds must differ from rotated crop AABB'
    for key,value,match in [('rotation',float('nan'),'rotation'),('rotationMatrix',[0,0],'rotationMatrix'),('orientedBounds',[-213,-213,426,426],'orientedBounds')]:
        bad={**rotated,key:value}
        try:v.verify_missile(p,{'bounds':native},bad,probes);raise AssertionError('invalid orientation accepted')
        except ValueError as e:assert match in str(e),(match,str(e))
    unsafe=copy.deepcopy(probes);unsafe[0]['w']*=2
    try:v.verify_missile(p,{'bounds':native},rotated,unsafe);raise AssertionError('expanded rotated damage core accepted')
    except ValueError as e:assert 'conservative' in str(e)
    p.write_bytes(original_png);p.with_suffix('.json').write_bytes(original_meta)
    # A hole inside one frame's proposed core must fail despite valid bbox/hash metadata.
    image.putpixel((140,220),(220,50,40,0));image.save(p);hole={**g,'sourceSha256':hashed(p)};meta(p,image,g['bounds'],[[100,200,300,300]]*4,core=g['core'])
    try:v.verify_missile(p,asset,hole);raise AssertionError('transparent core accepted')
    except ValueError as e:assert 'nonopaque' in str(e)
    image.putpixel((140,220),(220,50,40,255));image.save(p);g['sourceSha256']=hashed(p);meta(p,image,g['bounds'],[[100,200,300,300]]*4,core=g['core'])
    pickup=root/'items.png';items=Image.new('RGBA',(2048,2048));d=ImageDraw.Draw(items)
    for row in range(4):
        for col in range(4):
            d.rectangle((col*512+100,row*512+100,col*512+399,row*512+399),fill=(220,50,40,255))
            if row>=2:d.rectangle((col*512+200,row*512+200,col*512+299,row*512+299),fill=(0,0,0,0))
    items.save(pickup);rows=[[100,100,300,300]]*4;meta(pickup,items,None,[[[100,100,400,400]]*4 for _ in range(4)],rowBounds=rows);pa={'ready':True,'path':'items.png','rowBounds':rows};v.verify_pickups(pickup,pa)
    config={'density':True,'items':True,'missiles':{str(i):copy.deepcopy(asset) for i in range(1,14)},'geometry':{str(i):copy.deepcopy(g) for i in range(1,14)},'pickups':pa};assert v.verify(root,config,True)['status']=='passed'
    config['missiles']['13']['ready']=False;assert v.verify(root,config)['status']=='failed';config['density']=False;assert v.verify(root,config)['status']=='passed';assert v.verify(root,config,True)['status']=='failed'
    items.putpixel((256,1280),(255,0,0,255));items.save(pickup);meta(pickup,items,None,[[[100,100,400,400]]*4 for _ in range(4)],rowBounds=rows)
    try:v.verify_pickups(pickup,pa);raise AssertionError('filled shield center accepted')
    except ValueError as e:assert 'not transparent' in str(e)
    for field,suffix in [('edgeUnmix','.edge-unmix-mask.png'),('isolatedBackgroundRemoval','.isolated-background-mask.png')]:
        sidecar=p.with_suffix(suffix);mask=Image.new('L',image.size);mask.save(sidecar);data=json.loads(p.with_suffix('.json').read_text());data[field]={'maskSha256':hashed(sidecar)};p.with_suffix('.json').write_text(json.dumps(data));v.verify_missile(p,asset,g)
        mask.putpixel((0,0),255);mask.save(sidecar)
        try:v.verify_missile(p,asset,g);raise AssertionError('tampered preservation mask accepted')
        except ValueError as e:assert 'preservation-mask' in str(e)
        mask=Image.new('L',(512,512));mask.save(sidecar);data[field]['maskSha256']=hashed(sidecar);p.with_suffix('.json').write_text(json.dumps(data))
        try:v.verify_missile(p,asset,g);raise AssertionError('wrong mask dimensions accepted')
        except ValueError as e:assert 'dimensions' in str(e)
        del data[field];p.with_suffix('.json').write_text(json.dumps(data))
    bad=json.loads(p.with_suffix('.json').read_text());bad['status']='pending-root-visual-review';p.with_suffix('.json').write_text(json.dumps(bad))
    try:v.verify_missile(p,asset,g);raise AssertionError('pending art accepted as ready')
    except ValueError as e:assert 'accepted/root-reviewed' in str(e)
print('PASS production density verifier rejects hash/bounds/core/opacity/provenance/filled-shield errors; requires all13 only when enabled/complete; pending disabled assets remain explicit (synthetic inputs)')
