#!/usr/bin/env python3
"""Extract complete native Sprotel action frames using verified empty gutters.

No drawings are generated, scaled, duplicated or interpolated. Adaptive source
cuts are selected within +/-35px of each nominal quarter. Cropped pixels are
placed relative to that nominal quarter origin on a padded 384px transparent
cell. One shared Y translation per action aligns source ground baselines;
animated raised feet retain their native motion. The final user-facing atlas
pages are packed separately by the root task as 2x2 sheets.
"""
from pathlib import Path
import hashlib
import json
import statistics
from PIL import Image, ImageFilter

BASE=Path(__file__).resolve().parent
WORK=BASE.parent
REF=WORK/'Sproto-Arcade/art/reference/20261117-sprotel-bitcoin'
SOURCES={'walk':REF/'walk-source-4x4.png',
         'beer':BASE/'beer-source-4x4.png',
         'cocktail':BASE/'cocktail-source-4x4.png',
         'disk-laser':REF/'disk-laser-source-4x4.png'}
PAD=32
SIDE=384
GROUND=300

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def keyed(pixel):
    r,g,b=pixel[:3]
    return min(r,b)>=170 and min(r,b)-g>=95 and abs(r-b)<=70

def clean(image):
    data=list(image.getdata())
    field=Image.new('L',image.size)
    key=[keyed(p) for p in data]
    field.putdata([255 if p else 0 for p in key])
    adjacent=list(field.filter(ImageFilter.MaxFilter(3)).getdata())
    result=[]
    for i,(r,g,b,a) in enumerate(data):
        if key[i]:result.append((0,0,0,0));continue
        if adjacent[i] and min(r,b)-g>18 and min(r,b)>60:
            spill=min(r,b)-g;r,b=max(g,r-spill),max(g,b-spill)
        result.append((r,g,b,a))
    output=Image.new('RGBA',image.size);output.putdata(result)
    return output

def select_cuts(image,axis):
    width,height=image.size
    data=list(image.getdata())
    foreground=[not keyed(p) for p in data]
    length=width if axis=='x' else height
    counts=([sum(foreground[y*width+x] for y in range(height)) for x in range(width)]
            if axis=='x' else [sum(foreground[y*width:(y+1)*width]) for y in range(height)])
    records=[];cuts=[0]
    for quarter in range(1,4):
        nominal=round(quarter*length/4)
        empty=[p for p in range(max(0,nominal-35),min(length,nominal+36)) if counts[p]==0]
        runs=[]
        for p in empty:
            if runs and p==runs[-1][-1]+1:runs[-1].append(p)
            else:runs.append([p])
        if not runs:raise ValueError(f'No verified empty {axis} gutter near {nominal}')
        # Prefer the longest complete empty run, using proximity only as a tie-break.
        run=max(runs,key=lambda r:(len(r),-abs((r[0]+r[-1])/2-nominal)))
        cut=(run[0]+run[-1]+1)//2
        assert counts[cut]==0 and counts[cut-1]==0
        cuts.append(cut)
        records.append({'nominal':nominal,'emptyRunInclusive':[run[0],run[-1]],
                        'cut':cut,'foregroundPixelsAcrossCut':counts[cut]})
    cuts.append(length)
    return cuts,records

manifest={'schemaVersion':1,'method':'verified global empty-gutter cuts with conservative chroma despill',
          'generation':'source images from built-in image_gen; this script performs extraction only',
          'frameOrder':'row-major','sourceGrid':[4,4],'outputCellDimensions':[SIDE,SIDE],
          'registration':'nominal quarter origins, uniform 32px padding; one shared per-action Y offset',
          'finalAtlasLayout':'2x2 pages, packed by root task','actions':{}}
for action,path in SOURCES.items():
    image=Image.open(path).convert('RGBA');width,height=image.size
    xcuts,xrecords=select_cuts(image,'x');ycuts,yrecords=select_cuts(image,'y')
    native=[]
    for i in range(16):
        c,r=i%4,i//4
        cell=[xcuts[c],ycuts[r],xcuts[c+1],ycuts[r+1]]
        frame=clean(image.crop(cell));bounds=frame.getchannel('A').getbbox()
        if not bounds:raise ValueError(f'{action} {i}: empty source frame')
        if min(bounds[:2])<2 or bounds[2]>frame.width-2 or bounds[3]>frame.height-2:
            raise ValueError(f'{action} {i}: connected source content too close to adaptive edge {bounds}')
        nominal=[round(c*width/4),round(r*height/4)]
        native.append({'image':frame,'cell':cell,'bounds':bounds,'nominal':nominal,
                       'baseline':cell[1]-nominal[1]+bounds[3]})
    # The median baseline is robust to raised walking feet. This translation
    # applies to the entire action, never frame-by-frame.
    source_baseline=round(statistics.median(n['baseline'] for n in native))
    yoffset=GROUND-source_baseline
    output_folder=BASE/(action+'-frames');output_folder.mkdir(exist_ok=True)
    records=[]
    for i,n in enumerate(native):
        frame=n['image'];cell=n['cell'];nominal=n['nominal']
        offset=[PAD+cell[0]-nominal[0],PAD+cell[1]-nominal[1]+yoffset]
        if min(offset)<0 or offset[0]+frame.width>SIDE or offset[1]+frame.height>SIDE:
            raise ValueError(f'{action} {i}: padded frame would clip {offset} {frame.size}')
        output=Image.new('RGBA',(SIDE,SIDE));output.paste(frame,offset)
        bounds=output.getchannel('A').getbbox()
        assert min(bounds[:2])>=2 and max(bounds[2:])<=SIDE-2
        filename=output_folder/f'frame-{i:02d}.png';output.save(filename,compress_level=9)
        records.append({'index':i,'path':str(filename.relative_to(BASE)),
          'sourceCellXYXY':cell,'nominalOriginXY':nominal,'pasteOffsetXY':offset,
          'sourceBoundsInCellLTRB':list(n['bounds']),'bounds':list(bounds),
          'sourceGroundBaseline':n['baseline'],'outputGroundBaseline':n['baseline']+PAD+yoffset,
          'sha256':digest(filename),'alphaValues':sorted(set(output.getchannel('A').getdata()))})
    hashes=[r['sha256'] for r in records]
    assert len(set(hashes))==16,f'{action}: duplicate extracted frames'
    info={'source':str(path),'sourceSha256':digest(path),'sourceDimensions':[width,height],
          'xCuts':xcuts,'yCuts':ycuts,'xGutters':xrecords,'yGutters':yrecords,
          'sharedSourceBaseline':source_baseline,'sharedYOffset':yoffset,
          'distinctFrames':len(set(hashes)),'frames':records,
          'qa':'All cuts cross globally verified empty magenta lines. All16full native subjects are complete and padded; no edge fragments removed.'}
    (output_folder/'manifest.json').write_text(json.dumps(info,indent=2)+'\n')
    manifest['actions'][action]=info
    print(action,'cuts',xcuts,ycuts,'source baseline',source_baseline,'Y offset',yoffset,
          'output baseline range',min(r['outputGroundBaseline'] for r in records),max(r['outputGroundBaseline'] for r in records))
(BASE/'extracted-existing-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
