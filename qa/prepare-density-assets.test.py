#!/usr/bin/env python3
"""Synthetic fixtures for source preservation, transparent holes and four-frame cores."""
import importlib.util
import json
from pathlib import Path
import tempfile
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('prepare_density', root/'tools/prepare-density-assets.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

# Actual-field boundary unmix removes magenta matte from a black contour while
# retaining native colors and all interior pixels byte exact.
edge=Image.new('RGBA',(32,32));ed=ImageDraw.Draw(edge);ed.rectangle((7,7,24,24),fill=(20,20,20,255))
edge.putpixel((7,12),(126,0,127,255));edge.putpixel((16,16),(180,20,180,255))
protected=[((7,13),(220,70,50,255)),((7,14),(240,170,20,255)),((7,15),(10,170,220,255))]
for pos,color in protected:edge.putpixel(pos,color)
key=Image.new('L',(32,32),255);ImageDraw.Draw(key).rectangle((7,7,24,24),fill=0)
unmixed,edge_mask,info=module.unmix_pickup_edges(edge,key,[251,0,253])
r,g,b,a=unmixed.getpixel((7,12));assert max(r,g,b)<=2 and 120<=a<=130
assert unmixed.getpixel((16,16))==edge.getpixel((16,16))
for pos,color in protected:assert unmixed.getpixel(pos)==color
assert info['allRGBAOutsideEdgeMaskByteExact']

# Automatic noise cleanup never exceeds16pixels. The root-reviewed exact27
# pixel exception is explicit and does not broaden the global removal limit.
noise=Image.new('RGBA',(512,512));nd=ImageDraw.Draw(noise);nd.rectangle((200,200,300,300),fill=(60,100,130,255))
for y,width in enumerate([3,3,5,4,3,3,3,3]):nd.rectangle((106,33+y,106+width-1,33+y),fill=(210,10,210,255))
noise.putpixel((310,250),(210,10,210,255));noise.putpixel((120,35),(0,180,255,255))
clean,mask,items=module.remove_isolated_background(noise);assert mask.getbbox() is None
clean,mask,items=module.remove_isolated_background(noise,[[106,33,111,41]])
assert mask.histogram()[255]==27 and items[0]['explicitRootReviewedException']
assert clean.getpixel((310,250))==noise.getpixel((310,250));assert clean.getpixel((120,35))==noise.getpixel((120,35))

with tempfile.TemporaryDirectory(prefix='density-asset-proof-') as scratch:
    temp = Path(scratch)
    image = Image.new('RGBA', (2048, 2048), '#ff00ff')
    draw = ImageDraw.Draw(image)
    for row in range(4):
        for col in range(4):
            x, y = col*512, row*512
            draw.rectangle((x+100, y+170, x+350, y+330), fill=(40, 100, 130, 255))
            # A neon hull color must survive; it is not the actual field.
            draw.rectangle((x+130, y+200, x+200, y+260), fill=(250, 53, 224, 255))
            # Pure magenta enclosed hole must become transparent.
            draw.rectangle((x+240, y+220, x+260, y+240), fill=(255, 0, 255, 255))
            # Each trailing flame changes; common core must stay in the body.
            draw.rectangle((x+351, y+230-col*4, x+390+col*10, y+270+col*4), fill=(255, 120+col*15, 30, 255))
    # A near-field border pixel is flood keyed, while the same near-field
    # color enclosed inside a solid body stays byte exact.
    image.putpixel((4, 4), (250, 4, 248, 255))
    image.putpixel((150, 190), (250, 4, 248, 255))
    source = temp/'native.png'
    image.save(source)
    output = temp/'generated'
    proof = temp/'proof'
    records = module.prepare(source, 1, output, proof)
    assert len(records) == 4
    for record in records:
        path = Path(record['path'])
        row = record['stage']-1
        actual = Image.open(path).convert('RGBA')
        mask = Image.open(path.with_suffix('.key-mask.png'))
        assert actual.size == (2048, 512)
        assert actual.getpixel((150, 230)) == (250, 53, 224, 255)
        assert actual.getpixel((250, 230))[3] == 0
        original = image.crop((0, row*512, 2048, (row+1)*512))
        raw, out, keyed = original.tobytes(), actual.tobytes(), mask.tobytes()
        for i in range(2048*512):
            assert out[i*4:i*4+3] == raw[i*4:i*4+3]
            if not keyed[i]: assert out[i*4:i*4+4] == raw[i*4:i*4+4]
        cx, cy, cw, ch = record['core']
        for col in range(4):
            alpha = actual.crop((col*512+cx, cy, col*512+cx+cw, cy+ch)).getchannel('A')
            assert alpha.getextrema() == (255, 255)
        assert cx+cw <= record['coreAnalysis']['solidBodySearchROI'][0]+record['coreAnalysis']['solidBodySearchROI'][2]
        assert module.sha(path.read_bytes()) == record['outputSha256']
        assert module.sha(path.with_suffix('.key-mask.png').read_bytes()) == record['keyMaskSha256']
        assert (proof/f'missile-{record["stage"]:02d}-alpha-dark-light.png').exists()
    first = Image.open(output/'missiles/01/missile.png')
    assert first.getpixel((4, 4))[3] == 0
    assert first.getpixel((150, 190)) == image.getpixel((150, 190)), 'enclosed near-magenta hull pixel preserved'
    # Deterministic encoding/provenance without clocks, random IDs or image edits.
    before = {str(p.relative_to(output)): p.read_bytes() for p in output.rglob('*') if p.is_file()}
    module.prepare(source, 1, output, proof)
    after = {str(p.relative_to(output)): p.read_bytes() for p in output.rglob('*') if p.is_file()}
    assert before == after
    # Pickups retain the 4x4 atlas, four row crops and hollow transparency.
    pickup_source = temp/'pickup-native.png'
    pickup_image = image.copy()
    for row in [2,3]:
        for col in range(4): ImageDraw.Draw(pickup_image).rectangle((col*512+220,row*512+220,col*512+292,row*512+292), fill=(251,0,253,255))
    pickup_image.save(pickup_source)
    pickup_records = module.prepare(pickup_source, None, output, proof)
    pickup = Image.open(output/'pickups/items.png')
    assert pickup.size == (2048, 2048)
    assert len(pickup_records[0]['rowBounds']) == 4
    assert pickup.getpixel((250, 230))[3] == 0
    assert all(pickup.getpixel((col*512+256,row*512+256))[3]==0 for row in [2,3] for col in range(4))
    assert len(pickup_records[0]['keying']['hollowShieldSeeds'])==8
    grid=image.copy();grid_draw=ImageDraw.Draw(grid)
    for coordinate in [0,512,1024,1536,2048]:
        grid_draw.rectangle((max(0,coordinate-3),0,min(2047,coordinate+3),2047),fill='#000000')
        grid_draw.rectangle((0,max(0,coordinate-3),2047,min(2047,coordinate+3)),fill='#000000')
    keyed,grid_mask,info=module.key_background(grid,strip_grid=True)
    assert len(info['gridSeparatorRectangles'])==10
    assert keyed.getpixel((0,200))[3]==0
    assert keyed.getpixel((150,230))==grid.getpixel((150,230))
    collision_root=temp/'self-output';collision_source=collision_root/'pickups/items.png';collision_source.parent.mkdir(parents=True);pickup_image.save(collision_source)
    before_source=collision_source.read_bytes()
    try: module.prepare(collision_source,None,collision_root)
    except ValueError as error: assert 'collides' in str(error)
    else: raise AssertionError('native input was allowed to overwrite itself')
    assert collision_source.read_bytes()==before_source
    # Reject partial cells, empty frames, and a drifting frame with no common
    # opaque body. Validation runs before writing a partial accepted batch.
    cutoff = image.copy();cutoff.putpixel((0, 200), (20, 60, 80, 255))
    cutoff_path = temp/'cutoff.png';cutoff.save(cutoff_path)
    try: module.prepare(cutoff_path, 5, temp/'rejected')
    except ValueError as error: assert 'cutoff' in str(error)
    else: raise AssertionError('cutoff art accepted')
    assert not (temp/'rejected').exists()
    empty = image.copy();ImageDraw.Draw(empty).rectangle((0, 0, 511, 511), fill='#ff00ff')
    try: module.validate_cells(module.key_background(empty)[0])
    except ValueError as error: assert 'Empty' in str(error)
    else: raise AssertionError('empty cell accepted')
    tiny = Image.new('RGBA', (512, 512))
    try: module.common_body_core([tiny]*4, [10, 10, 100, 100])
    except ValueError: pass
    else: raise AssertionError('transparent common core accepted')
print('PASS lossless non-background RGBA/RGB preservation, field-only flood key, hollow magenta holes, deterministic artifacts/provenance, all-frame opaque body cores, pickups rows, proof sheets and clipping/empty/core rejection')
