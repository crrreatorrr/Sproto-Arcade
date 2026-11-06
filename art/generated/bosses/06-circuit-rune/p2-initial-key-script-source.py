"""Technical processing of a visually reviewed near-flat background; no painting."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps, ImageChops
import argparse, json, hashlib, importlib.util
p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('output',type=Path);p.add_argument('--background',type=int,nargs=3,required=True);p.add_argument('--tolerance',type=int,default=8);p.add_argument('--protect-mask',type=Path);p.add_argument('--also-magenta',action='store_true');p.add_argument('--cell-backgrounds',type=Path);p.add_argument('--provenance',type=Path,nargs='*',default=[]);a=p.parse_args()
spec=importlib.util.spec_from_file_location('frames',Path(__file__).parent.parent/'Sproto-Arcade/tools/extract-boss-clip.py');shared=importlib.util.module_from_spec(spec);spec.loader.exec_module(shared)
im=Image.open(a.source).convert('RGBA');w,h=im.size
if w!=h or w%4:raise ValueError('Source must be exact square4x4 atlas')
keyRgb=a.background;cellKeys=json.loads(a.cell_backgrounds.read_text()) if a.cell_backgrounds else None
if cellKeys and (len(cellKeys)!=16 or any(len(c)!=3 for c in cellKeys)):raise ValueError('Need16 RGB background colors in row-major order')
candidateBytes=bytearray()
for i,(r,g,b,al) in enumerate(im.getdata()):
 key=cellKeys[(i//w)//(h//4)*4+(i%w)//(w//4)] if cellKeys else keyRgb
 candidateBytes.append(255 if al==0 or max(abs(r-key[0]),abs(g-key[1]),abs(b-key[2]))<=a.tolerance or a.also_magenta and min(r,b)>=180 and min(r,b)-g>=95 and abs(r-b)<=65 else 0)
candidate=Image.frombytes('L',im.size,bytes(candidateBytes));flood=ImageOps.expand(candidate,border=1,fill=255);ImageDraw.floodfill(flood,(0,0),128,thresh=0);mask=flood.crop((1,1,w+1,h+1)).point(lambda v:255 if v==128 else 0);rgba=im.copy();rgba.putalpha(ImageChops.subtract(im.getchannel('A'),mask));native=True
if a.protect_mask:
 protect=Image.open(a.protect_mask).convert('L');native=not any(ImageChops.multiply(c,protect).getbbox() for c in ImageChops.difference(im,rgba).split())
 if not native:raise ValueError('Key touched exact native protectedcockpit; review source/key range')
assert im.convert('RGB').tobytes()==rgba.convert('RGB').tobytes()
size=w//4;frames=[];boxes=[]
for i in range(16):
 row,col=divmod(i,4);fr=rgba.crop((col*size,row*size,(col+1)*size,(row+1)*size));box=fr.getchannel('A').getbbox()
 if not box or min(box[0],box[1],size-box[2],size-box[3])<=1:raise ValueError(f'Frame{i} touches cell edge or retains unremoved background: {box}')
 frames.append(fr);boxes.append(box)
out,meta=shared.pack_frames(frames,boxes,512,12,shared.STATES);a.output.parent.mkdir(exist_ok=True,parents=True);out.save(a.output);rawPath=a.output.with_name(a.output.stem+'-source-keyed-rgba.png');rgba.save(rawPath);maskPath=a.output.with_name(a.output.stem+'-background-mask.png');mask.save(maskPath)
hashFile=lambda path:hashlib.sha256(path.read_bytes()).hexdigest();meta.update(source=str(a.source.resolve()),sourceSha256=hashFile(a.source),sourceKeyedRgba=str(rawPath.resolve()),backgroundMask=str(maskPath.resolve()),keyRgb=keyRgb,cellBackgroundRgbs=cellKeys,maximumPerChannelDistance=a.tolerance,alsoMagentaKey=a.also_magenta,edgeConnectedOnly=True,foregroundRgbByteExact=True,nativeProtectedRgbaByteExact=native,backgroundRemovedPixels=mask.histogram()[255],includesPilot=True,pilotOverlayRequired=False,enabledInGame=False,preparation='one commoncrop/nearestscale/anchor; each sourcecell preserved; no generated/duplicate/reorderedframes; alpha-onlybackgroundremoval',provenanceFiles=[{'path':str(x.resolve()),'sha256':hashFile(x)} for x in a.provenance],conversionScript=str(Path(__file__).resolve()),conversionScriptSha256=hashFile(Path(__file__)),outputSha256=hashFile(a.output),status='awaiting root visual review')
a.output.with_suffix('.json').write_text(json.dumps(meta,indent=2)+'\n');print(json.dumps({'output':str(a.output),'sha256':meta['outputSha256'],'bounds':meta['bounds'],'nativeProtectedRgbaByteExact':native}))
