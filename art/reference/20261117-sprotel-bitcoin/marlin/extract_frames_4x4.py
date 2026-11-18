from pathlib import Path
import importlib.util, json, hashlib, math
from PIL import Image, ImageChops, ImageFilter

base=Path(__file__).resolve().parent
repo=base.parent/'Sproto-Arcade'
spec=importlib.util.spec_from_file_location('matte',repo/'tools/extract-boss-clip.py')
shared=importlib.util.module_from_spec(spec);spec.loader.exec_module(shared)
manifest={'generation':'built-in image_gen','grid':[4,4],'frameOrder':'row-major',
          'sampling':'one native source cell per frame; no duplication or motion interpolation',
          'variants':{}}
for kind in ['standard','heavy']:
    source=base/(kind+'-source-4x4.png');folder=base/(kind+'-4x4');folder.mkdir(exist_ok=True)
    image=Image.open(source).convert('RGBA');side=math.ceil(image.width/4)
    edges=[round(i*image.width/4) for i in range(5)]
    records=[];hashes=[]
    for i in range(16):
        c,r=i%4,i//4;x,y=edges[c],edges[r];right,bottom=edges[c+1],edges[r+1]
        frame=image.crop((x,y,right,bottom))
        keyed,bounds,removed=shared.matte(frame,i,.2)
        # Verified source palette has no magenta; key any enclosed background
        # pockets inside wake/fin gaps using the identical strong chroma test.
        values=list(keyed.getdata())
        enclosed=bytes(255 if a and min(red,blue)>=180 and min(red,blue)-green>=95 and abs(red-blue)<=65 else 0
                       for red,green,blue,a in values)
        mask=Image.frombytes('L',keyed.size,enclosed)
        fringe=ImageChops.subtract(mask.filter(ImageFilter.MaxFilter(3)),mask).tobytes()
        cleaned=[]
        for j,(red,green,blue,a) in enumerate(values):
            if enclosed[j]:cleaned.append((0,0,0,0));continue
            if fringe[j] and min(red,blue)-green>18 and min(red,blue)>60:
                spill=min(red,blue)-green;red,blue=max(green,red-spill),max(green,blue-spill)
            cleaned.append((red,green,blue,a))
        keyed.putdata(cleaned)
        # Only transparent right/bottom padding is added for non-divisible
        # 1254px source dimensions. Source pixels are never moved or invented.
        output=Image.new('RGBA',(side,side));output.paste(keyed,(0,0))
        path=folder/('frame-'+str(i).zfill(2)+'.png');output.save(path)
        digest=hashlib.sha256(path.read_bytes()).hexdigest();hashes.append(digest)
        remaining=sum(a and min(red,blue)>=180 and min(red,blue)-green>=95 and abs(red-blue)<=65
                      for red,green,blue,a in output.getdata())
        assert remaining==0
        records.append({'index':i,'path':str(path.relative_to(base)),
           'sourceCell':[x,y,right-x,bottom-y],'outputDimensions':[side,side],
           'bounds':list(output.getchannel('A').getbbox()),'keyedBackgroundPixels':removed,
           'enclosedChromaPixelsKeyed':sum(v==255 for v in enclosed),
           'alphaValues':sorted(set(output.getchannel('A').getdata())),
           'residualMagentaPixels':remaining,'sha256':digest})
    assert len(set(hashes))==16,'Every native frame must be distinct'
    manifest['variants'][kind]={'source':source.name,'sourceDimensions':list(image.size),
       'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),
       'distinctFrames':len(set(hashes)),'frames':records}
(base/'manifest-4x4.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({kind:{'frames':v['distinctFrames'],'dimensions':v['sourceDimensions']} for kind,v in manifest['variants'].items()}))
