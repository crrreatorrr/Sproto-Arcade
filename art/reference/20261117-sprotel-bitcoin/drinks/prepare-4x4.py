"""Extract sixteen genuine source drawings. No duplication/interpolation or artwork synthesis."""
from pathlib import Path
from PIL import Image,ImageChops,ImageFilter
import hashlib,json,math

ROOT=Path(__file__).resolve().parent
report={'generator':'built-in image_gen','layout':'4x4 row-major','method':'Native source cells with rounded fractional boundaries, conservative magenta cleanup including enclosed background holes, pad-only to314-square; no duplicated/synthesized frames','assets':{}}
for family in ['beer','cocktail','disk-laser']:
    source=ROOT/(family+'-source-4x4.png');im=Image.open(source).convert('RGBA')
    assert im.width==im.height
    edges=[round(i*im.width/4) for i in range(5)];size=math.ceil(im.width/4)
    out=ROOT/(family+'-4x4');out.mkdir(exist_ok=True)
    records=[]
    for i in range(16):
        col,row=i%4,i//4;box=(edges[col],edges[row],edges[col+1],edges[row+1])
        cell=im.crop(box);pix=list(cell.getdata())
        key=Image.new('L',cell.size);key.putdata([255 if min(r,b)>=180 and min(r,b)-g>=95 and abs(r-b)<=65 else 0 for r,g,b,a in pix])
        fringe=ImageChops.subtract(key.filter(ImageFilter.MaxFilter(3)),key);km=list(key.getdata());fm=list(fringe.getdata());rgba=[]
        for j,(r,g,b,a) in enumerate(pix):
            if km[j]:rgba.append((0,0,0,0));continue
            if fm[j] and min(r,b)-g>18 and min(r,b)>60:
                spill=min(r,b)-g;r,b=max(g,r-spill),max(g,b-spill)
            rgba.append((r,g,b,a))
        clean=Image.new('RGBA',cell.size);clean.putdata(rgba)
        b=clean.getchannel('A').getbbox();assert b and min(b[:2])>1 and b[2]<cell.width-1 and b[3]<cell.height-1,(family,i,b,cell.size)
        padded=Image.new('RGBA',(size,size));offset=((size-cell.width)//2,(size-cell.height)//2);padded.paste(clean,offset)
        path=out/f'frame-{i:02}.png';padded.save(path)
        assert set(padded.getchannel('A').getdata())=={0,255}
        assert all((r,g,b)==(0,0,0) for r,g,b,a in padded.getdata() if a==0)
        records.append({'index':i,'sourceCellXYXY':list(box),'paddingOffset':list(offset),'boundsXYXY':list(padded.getchannel('A').getbbox()),'path':str(path),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
    assert len({r['sha256'] for r in records})==16,(family,'duplicated frame')
    union=[min(r['boundsXYXY'][0] for r in records),min(r['boundsXYXY'][1] for r in records),max(r['boundsXYXY'][2] for r in records),max(r['boundsXYXY'][3] for r in records)]
    report['assets'][family]={'source':str(source),'sourceSize':list(im.size),'sourceMode':'RGB','sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'frameSize':[size,size],'distinctFrames':16,'alpha':'binary RGBA, zero hidden RGB','sourceUnionXYXY':union,'frames':records}
(ROOT/'import-report-4x4.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:{'sourceSize':v['sourceSize'],'frameSize':v['frameSize'],'distinctFrames':v['distinctFrames'],'sourceUnionXYXY':v['sourceUnionXYXY']} for k,v in report['assets'].items()},indent=2))
