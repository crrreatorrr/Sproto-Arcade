#!/usr/bin/env python3
"""Pack four genuine 2x2 action images into one registered 4x4 boss atlas.

Spec rows idle/attack-a/attack-b/attack-c each name a source image. Reading order
provides four independently generated poses; no duplicated/invented frames. All
sixteen frames use one shared crop, nearest-neighbor scale and bottom baseline.
"""
import argparse,hashlib,importlib.util,json
from pathlib import Path
from PIL import Image,ImageDraw
s=importlib.util.spec_from_file_location('clip',Path(__file__).with_name('extract-boss-clip.py'));shared=importlib.util.module_from_spec(s);s.loader.exec_module(shared)

def build(specification,output,cell_size=512,padding=12):
 data=json.loads(specification.read_text());rows=data['rows']
 if [x['state'] for x in rows]!=list(shared.STATES):raise ValueError('Require idle/attack-a/attack-b/attack-c rows')
 frames=[];boxes=[];records=[];sources={};seen=set()
 for row in rows:
  p=Path(row['source']);p=p if p.is_absolute() else specification.parent/p;p=p.resolve()
  image=Image.open(p).convert('RGBA')
  if image.width!=image.height or image.width%2:raise ValueError('Each source must have square, even2x2 canvas')
  size=image.width//2;sources[str(p)]=hashlib.sha256(p.read_bytes()).hexdigest()
  for i in range(4):
   left=i%2*size;top=i//2*size;raw=image.crop((left,top,left+size,top+size));digest=hashlib.sha256(raw.tobytes()).hexdigest()
   if digest in seen:raise ValueError('Identical source action frames; regenerate real successive poses')
   seen.add(digest);frame,bounds,removed=shared.matte(raw,i,.2)
   if frames and frame.size!=frames[0].size:raise ValueError('All source cells need same registration canvas')
   exclusions=row.get('freeProjectileRegions',{}).get(str(i),[])
   mask=Image.new('L',frame.size,0);draw=ImageDraw.Draw(mask)
   for x,y,w,h in exclusions:
    if min(x,y)<0 or min(w,h)<=0 or x+w>size or y+h>size:raise ValueError('FX exclusion outside source cell')
    draw.rectangle((x,y,x+w-1,y+h-1),fill=255)
   if exclusions:
    if not row.get('freeProjectileReason'):raise ValueError('FX separation requires an explicit reviewed reason')
    frame.paste((0,0,0,0),(0,0),mask);bounds=frame.getchannel('A').getbbox()
    if bounds is None:raise ValueError('FX separation removed entire vehicle')
   frames.append(frame);boxes.append(bounds);records.append({'source':str(p),'sourceCell':i,'sourcePixelsSha256':digest,'backgroundPixelsRemoved':removed,'freeProjectileRegions':exclusions,'freeProjectileReason':row.get('freeProjectileReason') if exclusions else None,'fxExclusionMaskSha256':hashlib.sha256(mask.tobytes()).hexdigest() if exclusions else None})
 atlas,geometry=shared.pack_frames(frames,boxes,cell_size,padding)
 for frame,record in zip(geometry['frames'],records):frame.update(record)
 inputs={specification.resolve(),*(Path(p).resolve() for p in sources)}
 if output.resolve() in inputs or output.with_suffix('.json').resolve() in inputs:raise ValueError('Output must never overwrite source images or specification')
 output.parent.mkdir(parents=True,exist_ok=True);atlas.save(output,compress_level=9)
 meta={'schemaVersion':1,'kind':'four-generated-action-image-atlas','sources':sources,**geometry,'sampling':'Four genuine2x2 generated images; no invented or duplicated frames; one common crop/scale/baseline','atlasSha256':hashlib.sha256(output.read_bytes()).hexdigest()};output.with_suffix('.json').write_text(json.dumps(meta,indent=2)+'\n');return meta

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('specification',type=Path);p.add_argument('output',type=Path);a=p.parse_args()
 try:m=build(a.specification,a.output)
 except (ValueError,OSError,KeyError) as e:p.error(str(e))
 print(json.dumps({'output':str(a.output),'bounds':m['bounds']}))
if __name__=='__main__':main()
