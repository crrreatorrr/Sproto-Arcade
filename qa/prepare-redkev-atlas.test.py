#!/usr/bin/env python3
"""Prove exact connected-source recovery without duplicating neighboring frames."""
import importlib.util
from pathlib import Path
import tempfile
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('redkev_pack',root/'tools/prepare-redkev-atlas.py');tool=importlib.util.module_from_spec(spec);spec.loader.exec_module(tool)
# Outside-only neon halo extension separates washed-field bridges without
# keying interior pink or changing source RGB. Explicit cabin protection wins.
neon=Image.new('RGBA',(32,32),(251,0,253,255));n=ImageDraw.Draw(neon)
n.rectangle((3,8,11,24),fill=(20,80,100,255));n.rectangle((20,8,28,24),fill=(20,80,100,255))
n.rectangle((12,14,19,18),fill=(255,80,255,255));n.rectangle((5,12,9,20),fill=(255,50,255,255));n.rectangle((22,8,26,9),fill=(255,50,255,255))
base=Image.new('L',(32,32));base.putdata([255 if p[:3]==(251,0,253) else 0 for p in neon.getdata()])
clean,total,extra,info=tool.extend_neon_outside(neon,base,protected_cabin=(21,7,28,11))
assert clean.getpixel((15,16))[3]==0,'washed-field bridge is keyed'
assert clean.getpixel((7,16))==neon.getpixel((7,16)),'enclosed native neon stays byte exact'
assert clean.getpixel((24,8))==neon.getpixel((24,8)),'explicit native cabin pink is protected'
assert info['protectedCabinCandidatePixelsPreserved']==10
assert clean.convert('RGB').tobytes()==neon.convert('RGB').tobytes()

with tempfile.TemporaryDirectory(prefix='redkev-pack-') as scratch:
    d=Path(scratch);image=Image.new('RGBA',(2048,2048),'#ff00ff');draw=ImageDraw.Draw(image)
    for row in range(4):
        for col in range(4):draw.rectangle((col*512+100,row*512+100,col*512+350,row*512+350),fill=(160+row*10,30+col*10,20,255))
    # Actual connected muzzle overflow from source row2/col3 into blank margin.
    draw.rectangle((1018,740,1124,744),fill=(250,100,40,255));source=d/'native.png';image.save(source)
    output=d/'p1.png';meta=tool.build(source,output);assert meta['recovery']['recoveredPixelCount']==30
    assert meta['recovery']['sourceForegroundPixels']==meta['recovery']['outputForegroundPixels']
    assert meta['recovery']['allMattedRGBAPixelsCopiedExactlyOnce'];assert meta['destinationSize'][0]<=506
    actual=Image.open(output);box=meta['unionCrop'];off=meta['offset']
    # Every opaque source pixel retains both its owning frame and exact color.
    for index in range(16):
        col,row=index%4,index//4;bounds=meta['frames'][index]['cellBounds'];assert min(bounds[:2])>=3 and max(bounds[2:])<=509
        sample_x=col*512+100+16-box[0]+off[0];sample_y=row*512+100-box[1]+off[1]
        assert actual.getpixel((sample_x,sample_y))==(160+row*10,30+col*10,20,255)
    recovered_x=2*512-6+16-box[0]+off[0];recovered_y=512+228-box[1]+off[1]
    assert actual.getpixel((recovered_x,recovered_y))==(250,100,40,255)
    # Neighboring source frame gets no copy of that foreign connected component.
    neighboring_x=512+506+16-box[0]+off[0]
    if neighboring_x<1024:assert actual.getpixel((neighboring_x,recovered_y))[3]==0
    ambiguous=image.copy();ImageDraw.Draw(ambiguous).rectangle((800,700,1200,800),fill=(200,80,20,255));path=d/'ambiguous.png';ambiguous.save(path)
    try:tool.build(path,d/'reject.png')
    except ValueError as error:assert 'Ambiguous' in str(error)
    else:raise AssertionError('ambiguous neighboring frame contamination accepted')
    assert not (d/'reject.png').exists()
    too_far=image.copy();ImageDraw.Draw(too_far).rectangle((1000,740,1124,744),fill=(250,100,40,255));path=d/'far.png';too_far.save(path)
    try:tool.build(path,d/'far-output.png')
    except ValueError as error:assert 'recovery window' in str(error)
    else:raise AssertionError('bleed outside authorized16px window accepted')
    wide=Image.new('RGBA',(2048,2048),'#ff00ff');wd=ImageDraw.Draw(wide)
    for row in range(4):
        for col in range(4):wd.rectangle((col*512+30,row*512+100,col*512+490,row*512+350),fill=(160+row*10,30+col*10,20,255))
    wd.rectangle((1008,740,1054,744),fill=(250,100,40,255));path=d/'wide.png';wide.save(path)
    try:tool.build(path,d/'wide-strict.png')
    except ValueError as error:assert 'does not fit' in str(error)
    else:raise AssertionError('unapproved downscale accepted')
    packed=tool.build(path,d/'wide-approved.png',allow_downscale=True)
    assert packed['uniformSourceScale']<1 and packed['destinationSize'][0]==506
    assert packed['recovery']['sourceForegroundPixels']==packed['recovery']['sourceForegroundPixelsInOwnerBuffers']
    assert packed['recovery']['outputForegroundPixels']<packed['recovery']['sourceForegroundPixels']
    assert len(packed['frames'])==16 and 'one shared uniform nearest-neighbor' in packed['sampling']
print('PASS exact connected-component bleed recovery, one shared1x translation or explicitly authorized uniform-nearest-downscale, all16correspondingframes, no neighbor duplication, foreground pixel conservation, ambiguous/overwide recovery rejection')
