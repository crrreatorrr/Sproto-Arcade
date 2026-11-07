#!/usr/bin/env python3
"""Synthetic raster tests; no generated production art or profiles are edited."""
import copy, importlib.util, json, shutil, tempfile
from pathlib import Path
from PIL import Image, ImageDraw
spec=importlib.util.spec_from_file_location('redkev_geometry',Path(__file__).with_name('measure-redkev-geometry.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
original_root=m.ROOT;actual=m.load_data()
assert m.project([100,100,300,350],[100,100,300,350],[930,290,340,310])==[967.0,290.0,266.0,310.0]
with tempfile.TemporaryDirectory(prefix='redkev-geometry-') as temporary:
    root=Path(temporary);manifest={'phases':[],'projectiles':[]}
    for phase in range(2):
        for group in ['phases','projectiles']:
            image=Image.new('RGBA',(2048,2048));draw=ImageDraw.Draw(image);rows=[]
            for row in range(4):
                K=[100,100,300,350] if group=='phases' else [100,180,100+row*10,60]
                rows.append(K)
                for col in range(4):draw.rectangle((col*512+K[0],row*512+K[1],col*512+K[0]+K[2]-1,row*512+K[1]+K[3]-1),fill=(180,30,25,255))
            path=root/f'{group}-{phase}.png';image.save(path);bounds=[100,100,300,350] if group=='phases' else [100,180,130,60]
            path.with_suffix('.json').write_text(json.dumps({'bounds':bounds,'rowBounds':rows}))
            manifest[group].append({'path':str(path),'bounds':bounds,'rowBounds':rows,'facing':'left','ready':True})
    data={'manifest':manifest,'geometry':copy.deepcopy(actual['geometry'])};out=root/'proof';out.mkdir()
    geometry=m.measure(data,None,out);choices=json.loads((out/'choices-template.json').read_text());choices['reviewed']=True
    reviewed=m.measure(data,choices,out)
    for phase in range(2):
        p=reviewed[str(phase)];assert p['provenance']['bossSha256']==m.sha(manifest['phases'][phase]['path'])
        for group in ['projectiles','beams']:
            for name,profile in p[group].items():
                row=int(name.rsplit('@',1)[1]);assert profile['reference']==[100,180,130,60];assert profile['crop']==[100,180,100+row*10,60];assert profile['core']==profile['crop'];assert profile['visualBox']==data['geometry']['1'][str(phase)][group][name]['visualBox']
    bad=copy.deepcopy(choices);bad['phases'][0]['assetHashes']['bossSha256']='bad'
    try:m.measure(data,bad,out);raise AssertionError('stale hash accepted')
    except ValueError as error:assert 'pin current' in str(error)
    for field in ['body','target']:
        bad=copy.deepcopy(choices)
        if field=='body':bad['phases'][0]['body']=[0,0,500,500]
        else:bad['phases'][0]['targets']['marina-vent']=[0,0,500,500]
        try:m.measure(data,bad,out);raise AssertionError('crop-exterior geometry accepted')
        except ValueError as error:assert 'outside measured' in str(error) or 'opaque coverage' in str(error)
    # Publish into a throwaway repository and compare every original profile/source byte.
    shutil.copyfile(original_root/'boss-sheets.js',root/'boss-sheets.js');prefix='const SPRITE_HITBOXES='+json.dumps({'enabled':True,'stages':data['geometry']})+';\n';(root/'sprite-hitboxes.js').write_text(prefix);m.ROOT=root
    result=m.publish(reviewed,data,choices);assert result['old12ProfilesStructurallyEqual'];assert (root/'sprite-hitboxes.js').read_text().startswith(prefix)
    assert m.load_data()['geometry']['13']==reviewed
    try:m.publish(reviewed,data,choices);raise AssertionError('duplicate generated block accepted')
    except ValueError as error:assert 'already exists' in str(error)
print('PASS exact Canvas projection, 16-frame common body, four-frame projectile cores, source-hash pinning, authored layout preservation, review overlays and append-only ID13 publication preserving all old12 profiles (synthetic raster inputs)')
