#!/usr/bin/env python3
"""Pack Sprotel Phase 1 native animations into four 2x2 pages per family.

Only chroma cleanup, source registration, one shared per-animation transform,
nearest-neighbour scaling and atlas packing occur here. No new poses, duplicate
frames, interpolated motion or per-frame scaling are introduced.
"""
from pathlib import Path
import argparse
import hashlib
import json
import shutil
import statistics
from PIL import Image, ImageChops, ImageFilter

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'art/reference/20261117-sprotel-bitcoin'
OUT=ROOT/'art/generated/bosses/14-sprotel-bitcoin'
TASK_SOURCE=ROOT.parent/'sprotel-boss'
CELL=512
PADDING=12
BODY_ACTIONS=('idle','walk','beer','cocktail','marlin','disk-laser')
PROJECTILES=(('beer','beer',SOURCE/'drinks/beer-4x4'),
             ('cocktail','cocktail',SOURCE/'drinks/cocktail-4x4'),
             ('blueMarlin','marlin',SOURCE/'marlin/standard-4x4'),
             ('heavyMarlin','heavy-marlin',SOURCE/'marlin/heavy-4x4'),
             ('diskLaser','disk-laser',SOURCE/'drinks/disk-laser-4x4'))


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def relative(path):
    return str(path.resolve().relative_to(ROOT))


def chroma(pixel):
    r,g,b=pixel[:3]
    return min(r,b)>=170 and min(r,b)-g>=95 and abs(r-b)<=70


def key_frame(frame):
    values=list(frame.getdata())
    key=[chroma(p) for p in values]
    field=Image.new('L',frame.size)
    field.putdata([255 if p else 0 for p in key])
    adjacent=list(field.filter(ImageFilter.MaxFilter(3)).getdata())
    pixels=[]
    for i,(r,g,b,a) in enumerate(values):
        if key[i] or not a:
            pixels.append((0,0,0,0));continue
        if adjacent[i] and min(r,b)-g>18 and min(r,b)>60:
            spill=min(r,b)-g;r,b=max(g,r-spill),max(g,b-spill)
        pixels.append((r,g,b,a))
    output=Image.new('RGBA',frame.size);output.putdata(pixels)
    bounds=output.getchannel('A').getbbox()
    if not bounds or min(bounds[:2])<2 or bounds[2]>frame.width-2 or bounds[3]>frame.height-2:
        raise ValueError(f'Source content is empty or clips a cell edge: {bounds} in {frame.size}')
    return output


def import_native_pages(action):
    paths=[TASK_SOURCE/f'{action}-page{i}-source-2x2.png' for i in range(1,5)]
    # Once source pages have been copied, packing is fully reproducible in a clone.
    if not all(p.exists() for p in paths):
        paths=[SOURCE/p.name for p in paths]
    if not all(p.exists() for p in paths):
        return False
    records=[];frames=[];page_baselines=[]
    for page,path in enumerate(paths):
        target=SOURCE/path.name
        if path.resolve()!=target.resolve():shutil.copy2(path,target)
        image=Image.open(target).convert('RGBA')
        if image.width!=image.height:raise ValueError(f'{target}: source page must be square')
        edges=[round(i*image.width/2) for i in range(3)]
        group=[]
        for i in range(4):
            c,r=i%2,i//2;box=[edges[c],edges[r],edges[c+1],edges[r+1]]
            frame=key_frame(image.crop(box))
            # Quarter origin is retained. The temporary 704px canvas permits
            # the explicitly reviewed idle page-four source registration fix.
            padded=Image.new('RGBA',(704,704));padded.paste(frame,(32,32))
            group.append(padded)
            records.append({'index':page*4+i,'generator':'built-in image_gen',
              'masterSource':relative(target),'masterSourceSha256':sha(target),
              'masterSourceDimensions':list(image.size),'sourceCellXYXY':box,
              'nativePage':page+1,'nativePageFrame':i,'sourcePaddingXY':[32,32]})
        page_baselines.append(statistics.median(f.getchannel('A').getbbox()[3] for f in group))
        frames.extend(group)
    # Source page four was generated 8-10 pixels higher than the first three
    # idle pages. Register the complete page uniformly; retain its internal bob.
    registration=[0,0,0,0]
    if action=='idle':registration[3]=round(statistics.median(page_baselines[:3])-page_baselines[3])
    folder=SOURCE/'body'/action;folder.mkdir(parents=True,exist_ok=True)
    for i,frame in enumerate(frames):
        dy=registration[i//4]
        if dy:
            aligned=Image.new('RGBA',frame.size);aligned.paste(frame,(0,dy));frame=aligned
        path=folder/f'frame-{i:02d}.png';frame.save(path,compress_level=9)
        records[i].update({'path':relative(path),'sha256':sha(path),
            'pageRegistrationOffsetXY':[0,dy], 'bounds':list(frame.getchannel('A').getbbox())})
    manifest={'generator':'built-in image_gen','sourceLayout':[2,2],
       'registration':'single reviewed translation for idle page four; no per-frame transform',
       'pageSourceBaselines':page_baselines,'pageRegistrationYOffset':registration,
       'frames':records,'distinctFrames':len({r['sha256'] for r in records})}
    if manifest['distinctFrames']!=16:raise ValueError(f'{action}: source frames repeat')
    (folder/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    for name in [f'{action}-prompts-2x2.json',f'{action}-pages-generation.json']:
        if (TASK_SOURCE/name).exists():shutil.copy2(TASK_SOURCE/name,SOURCE/name)
    for prompt in TASK_SOURCE.glob(f'{action}-page*-prompt-2x2.txt'):
        shutil.copy2(prompt,SOURCE/prompt.name)
    return True


def source_proofs(folder,action,kind):
    if kind=='body':
        record_path=folder/'manifest.json'
        data=json.loads(record_path.read_text())
        rows=data['frames']
        master=SOURCE/Path(data.get('source','')).name
        for row in rows:
            if 'masterSource' not in row and master.is_file():
                row['masterSource']=relative(master);row['masterSourceSha256']=sha(master)
        return rows,relative(record_path)
    if action in ('marlin','heavy-marlin'):
        record_path=SOURCE/'marlin/manifest-4x4.json'
        data=json.loads(record_path.read_text())['variants']['standard' if action=='marlin' else 'heavy']
        rows=data['frames'];master=SOURCE/'marlin'/data['source']
        for row in rows:
            x,y,w,h=row['sourceCell'];row['sourceCellXYXY']=[x,y,x+w,y+h]
            row['masterSource']=relative(master);row['masterSourceSha256']=sha(master)
        return rows,relative(record_path)
    record_path=SOURCE/'drinks/import-report-4x4.json'
    data=json.loads(record_path.read_text())['assets'][action]
    rows=data['frames'];master=SOURCE/'drinks'/Path(data['source']).name
    for row in rows:
        row['masterSource']=relative(master);row['masterSourceSha256']=sha(master)
    return rows,relative(record_path)


def load_frames(folder,action,kind):
    paths=[folder/f'frame-{i:02d}.png' for i in range(16)]
    if not all(p.is_file() for p in paths):return None
    frames=[Image.open(p).convert('RGBA') for p in paths]
    if len({im.size for im in frames})!=1:raise ValueError(f'{action}: inconsistent native cell sizes')
    proofs,proof_path=source_proofs(folder,action,kind)
    records=[]
    for i,(im,path,proof) in enumerate(zip(frames,paths,proofs)):
        bounds=im.getchannel('A').getbbox()
        if not bounds or min(bounds[:2])<2 or bounds[2]>im.width-2 or bounds[3]>im.height-2:
            raise ValueError(f'{path}: incomplete/edge-touching native frame {bounds}')
        alpha=set(im.getchannel('A').getdata())
        if not alpha.issubset({0,255}):raise ValueError(f'{path}: nonbinary alpha')
        record={'sourceFrame':relative(path),'sourceFrameSha256':sha(path),
           'sourceFrameDimensions':list(im.size),'sourceFrameBoundsLTRB':list(bounds),
           'generatedSourceProof':proof_path,'generator':'built-in image_gen'}
        for key in ['masterSource','masterSourceSha256','sourceCellXYXY','nominalOriginXY',
                    'pasteOffsetXY','pageRegistrationOffsetXY','nativePage','nativePageFrame']:
            if key in proof:record[key]=proof[key]
        records.append(record)
    if len({r['sourceFrameSha256'] for r in records})!=16:
        raise ValueError(f'{action}: not sixteen distinct native frames')
    return frames,records


def union_ltrb(boxes):
    return [min(b[0] for b in boxes),min(b[1] for b in boxes),
            max(b[2] for b in boxes),max(b[3] for b in boxes)]


def xywh(box):
    return [box[0],box[1],box[2]-box[0],box[3]-box[1]]


def largest_opaque_core(frames):
    mask=frames[0].getchannel('A')
    for im in frames[1:]:mask=ImageChops.darker(mask,im.getchannel('A'))
    width,height=mask.size;data=mask.tobytes();hist=[0]*width
    best=None;best_area=0;best_distance=float('inf')
    for y in range(height):
        for x in range(width):hist[x]=hist[x]+1 if data[y*width+x]==255 else 0
        stack=[]
        for x in range(width+1):
            value=hist[x] if x<width else 0;start=x
            while stack and stack[-1][1]>value:
                left,tall=stack.pop();start=left
                area=(x-left)*tall;distance=abs((left+x)/2-width/2)+abs(y+1-tall/2-height/2)
                if area>best_area or area==best_area and distance<best_distance:
                    best_area=area;best_distance=distance;best=[left,y+1-tall,x-left,tall]
            if value and (not stack or stack[-1][1]<value):stack.append((start,value))
    if not best or best_area==0:raise ValueError('Animation has no shared opaque core')
    x,y,w,h=best
    for im in frames:
        if im.getchannel('A').crop((x,y,x+w,y+h)).getextrema()!=(255,255):
            raise ValueError('Core is not opaque in every source frame')
    return best


def transform_frames(frames,body_height=None):
    crop=union_ltrb([im.getchannel('A').getbbox() for im in frames])
    width,height=crop[2]-crop[0],crop[3]-crop[1]
    scale=body_height/height if body_height is not None else min(488/width,488/height)
    draw_width=round(width*scale);draw_height=round(height*scale)
    if draw_width>488 or draw_height>488:raise ValueError('Shared animation transform exceeds padding')
    offset=[(CELL-draw_width)//2,CELL-PADDING-draw_height if body_height is not None else (CELL-draw_height)//2]
    output=[]
    for frame in frames:
        cell=Image.new('RGBA',(CELL,CELL))
        cropped=frame.crop(crop).resize((draw_width,draw_height),Image.Resampling.NEAREST)
        cell.paste(cropped,offset)
        bounds=cell.getchannel('A').getbbox()
        if min(bounds[:2])<PADDING or max(bounds[2:])>CELL-PADDING:
            raise ValueError(f'Packed frame clips padding: {bounds}')
        output.append(cell)
    return output,{'sourceUnionCropLTRB':crop,'uniformScale':scale,
         'destinationDimensions':[draw_width,draw_height],'offsetXY':offset,
         'baseline':CELL-PADDING if body_height is not None else None,
         'registration':'one shared crop, scale and anchor for all sixteen native frames'}


def name_for(action,kind,page):
    if kind=='body' and action=='idle' and page==1:return 'p1.png'
    if kind=='projectile' and action=='beer' and page==1:return 'p1-projectiles.png'
    return f'p1-{action}-'+('projectiles-' if kind=='projectile' else '')+f'page{page}.png'


def save_family(key,action,kind,data,body_height=None):
    native,proofs=data;frames,transform=transform_frames(native,body_height)
    union=xywh(union_ltrb([im.getchannel('A').getbbox() for im in frames]))
    core=largest_opaque_core(frames)
    entry={'frameCount':16,'framesPerSecond':10,'columns':2,'rows':2,
       'frameWidth':CELL,'frameHeight':CELL,'bounds':union,'core':core,
       'coreStatus':'largest rectangle fully opaque in the intersection of all sixteen native frames',
       'facing':'left','transform':transform,'pages':[]}
    for page in range(4):
        atlas=Image.new('RGBA',(1024,1024));records=[]
        for local in range(4):
            index=page*4+local;frame=frames[index]
            atlas.paste(frame,((local%2)*CELL,(local//2)*CELL))
            records.append({'index':index,'pageFrame':local,'row':local//2,'column':local%2,
                 'cellBounds':list(frame.getchannel('A').getbbox()),**proofs[index]})
        filename=name_for(action,kind,page+1);path=OUT/filename;atlas.save(path,compress_level=9)
        bounds=xywh(union_ltrb([r['cellBounds'] for r in records]))
        version=sha(path)
        page_metadata={'path':relative(path),'ready':True,'width':1024,'height':1024,
            'columns':2,'rows':2,'frameWidth':512,'frameHeight':512,'frames':records,
            'bounds':bounds,'animationBounds':union,'core':core,'version':version[:16],
            'atlasSha256':version,'page':page+1,'frameStart':page*4,'frameCount':4,
            'generator':'built-in image_gen','phase':1,'kind':kind,'animation':key,
            'sampling':'one-to-one native drawings; no duplication, interpolation or invented poses',
            'transform':transform}
        path.with_suffix('.json').write_text(json.dumps(page_metadata,indent=2)+'\n')
        entry['pages'].append({k:page_metadata[k] for k in ['path','ready','width','height',
            'columns','rows','bounds','version','atlasSha256','page','frameStart','frameCount']})
        PRODUCED.add(filename)
    return entry


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--require-complete',action='store_true')
    args=parser.parse_args()
    SOURCE.mkdir(parents=True,exist_ok=True);OUT.mkdir(parents=True,exist_ok=True)
    for action in ('idle','marlin'):import_native_pages(action)
    bodies={action:load_frames(SOURCE/'body'/action,action,'body') for action in BODY_ACTIONS}
    pending=[f'body/{action}' for action,data in bodies.items() if data is None]
    available={action:data for action,data in bodies.items() if data is not None}
    # Every full-body action receives the same alpha-union height, even when
    # the source generator drew cocktail sprites smaller than the other sheets.
    # This common height also reserves safe space for the widest firing pose.
    ratios=[]
    for frames,proofs in available.values():
        b=union_ltrb([im.getchannel('A').getbbox() for im in frames])
        ratios.append((b[3]-b[1])/(b[2]-b[0]))
    body_height=min([440]+[int(488*r) for r in ratios])
    manifest={'schemaVersion':1,'phase':1,'generator':'built-in image_gen',
       'authorization':'User approved built-in image generation, parallel animation agents and Phase 1 only on 2026-11-17',
       'layout':'four 2x2 pages per sixteen-frame animation',
       'runtimePageDimensions':[1024,1024],'cellDimensions':[512,512],
       'sharedBodyHeight':body_height,'animations':{},'projectileAnimations':{},'pending':pending}
    for action,data in available.items():
        manifest['animations'][action]=save_family(action,action,'body',data,body_height)
    body_bounds=[e['bounds'] for e in manifest['animations'].values()]
    body_reference=xywh(union_ltrb([[x,y,x+w,y+h] for x,y,w,h in body_bounds]))
    manifest['bodyReferenceBounds']=body_reference
    for entry in manifest['animations'].values():
        entry['referenceBounds']=body_reference
        for page in entry['pages']:
            metadata_path=(ROOT/page['path']).with_suffix('.json')
            metadata=json.loads(metadata_path.read_text())
            metadata['referenceBounds']=body_reference
            metadata_path.write_text(json.dumps(metadata,indent=2)+'\n')
    for key,action,folder in PROJECTILES:
        data=load_frames(folder,action,'projectile')
        if data is None:pending.append(f'projectile/{action}');continue
        manifest['projectileAnimations'][key]=save_family(key,action,'projectile',data)
        manifest['projectileAnimations'][key]['referenceBounds']=manifest['projectileAnimations'][key]['bounds']
    # Remove only stale Phase 1 runtime pages in this task's ID14 output folder.
    # Reference sources, other boss IDs and all Phase 2 assets remain untouched.
    for old in OUT.glob('p1*.png'):
        if old.name not in PRODUCED:
            old.unlink();old.with_suffix('.json').unlink(missing_ok=True)
    manifest['pageCount']=len(PRODUCED)
    manifest['frameCount']=sum(e['frameCount'] for group in ['animations','projectileAnimations'] for e in manifest[group].values())
    manifest['complete']=not pending and len(PRODUCED)==44
    manifest_path=OUT/'animation-manifest.json'
    manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
    qa={'status':'passed' if manifest['complete'] else 'pending','phase':1,
        'pages':len(PRODUCED),'frames':manifest['frameCount'],'pending':pending,
        'pageSize':[1024,1024],'pageGrid':[2,2],'bodyHeight':body_height,
        'allFramesNativeAndDistinct':True,'allCellsHaveAtLeast12pxPadding':True,
        'projectileCores':'each verified fully opaque in all sixteen corresponding packed frames',
        'manifestSha256':sha(manifest_path)}
    (OUT/'asset-qa.json').write_text(json.dumps(qa,indent=2)+'\n')
    print(json.dumps(qa,indent=2))
    if args.require_complete and not manifest['complete']:raise SystemExit(1)


PRODUCED=set()
if __name__=='__main__':main()
