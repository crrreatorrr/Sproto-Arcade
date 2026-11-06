#!/usr/bin/env python3
"""Pack 16 genuine, explicitly selected video frames from four authored action rows.

Spec JSON has rows idle/attack-a/attack-b/attack-c, each with source video and four
increasing timestamps. One original clip may supply both idle and an attack, but
no source/timestamp pair may repeat. All frames share a single crop and scale.
Optional clip-wide nearest-neighbor registration preserves complete source canvases.
This tool generates no art, interpolation or simulated animation poses.
"""
import argparse, hashlib, importlib.util, json, math
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFilter

spec = importlib.util.spec_from_file_location('boss_clip', Path(__file__).with_name('extract-boss-clip.py'))
shared = importlib.util.module_from_spec(spec)
spec.loader.exec_module(shared)


def separate_fx(raw, source, profile, allow_enclosed=False):
    """Separate free projectile flight, preserving all prefire hardware pixels.

    The reference frame supplies ONLY a protective alpha mask, never RGB pixels.
    Local muzzle circles remain unchanged. No hidden hardware is reconstructed.
    """
    timestamp=profile['protectSourceTime']
    original=shared.extract(source,timestamp)
    physical,_,_=shared.matte(original,timestamp,.2)
    protection=physical.getchannel('A')
    if allow_enclosed:
        protection.putdata([0 if min(r,b)>=80 and min(r,b)-g>=45 and abs(r-b)<=65 else a
                            for (r,g,b,_),a in zip(original.getdata(),protection.getdata())])
    padding=profile.get('protectPadding',2)
    if padding not in (0,1,2,3):raise ValueError('Physical protection padding must be 0..3 pixels')
    if padding:protection=protection.filter(ImageFilter.MaxFilter(padding*2+1))
    keep=Image.new('L',raw.size,0);draw=ImageDraw.Draw(keep)
    for x,y,radius in profile.get('keepCircles',[]):draw.ellipse((x-radius,y-radius,x+radius,y+radius),fill=255)
    regions=Image.new('L',raw.size,0);draw=ImageDraw.Draw(regions)
    for x,y,w,h in profile['rectangles']:draw.rectangle((x,y,x+w-1,y+h-1),fill=255)
    remove=ImageChops.subtract(regions,ImageChops.lighter(protection,keep))
    result=raw.copy();result.paste((255,0,255,255),(0,0),remove)
    if ImageChops.multiply(ImageChops.difference(raw,result).convert('RGB').convert('L'),protection).getbbox():
        raise ValueError('FX separation modified protected physical pixels')
    record={**profile,'sourcePhysicalFramePixelsSha256':hashlib.sha256(original.tobytes()).hexdigest(),
            'exclusionMaskSha256':hashlib.sha256(remove.tobytes()).hexdigest(),
            'protectedHardwareUnchanged':True,'referenceRGBPixelsCopied':False,
            'purpose':'Free traveling projectile FX separation; all physical hardware protected; local muzzle ignition retained'}
    return result,remove,record


def build(spec_path, output, cell_size=512, padding=12):
    data=json.loads(spec_path.read_text()); rows=data.get('rows',[])
    if [r.get('state') for r in rows] != list(shared.STATES):
        raise ValueError('Exactly four rows in idle/attack-a/attack-b/attack-c order required')
    if output.suffix.lower()!='.png' or cell_size<16 or padding<2 or padding*2>=cell_size:
        raise ValueError('PNG output, cell size >=16 and valid padding >=2 required')
    frames=[]; boxes=[]; samples=[]; seen=set(); sources={}
    for row in rows:
        path=Path(row['source']); path=path if path.is_absolute() else spec_path.parent/path
        path=path.resolve(); times=row.get('timestamps',[])
        if len(times)!=4 or any(not isinstance(t,(int,float)) or not math.isfinite(t) or t<0 for t in times) or times!=sorted(set(times)):
            raise ValueError('Each row requires four unique increasing finite timestamps')
        if not path.is_file(): raise ValueError(f'Missing video: {path}')
        if str(path) not in sources:
            stream,duration=shared.probe(path)
            sources[str(path)]={'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'durationSeconds':duration,'frameRate':stream.get('avg_frame_rate')}
        for timestamp in times:
            key=(str(path),timestamp)
            if key in seen: raise ValueError('Source/timestamp reuse would duplicate a selected animation frame')
            seen.add(key)
            if sources[str(path)]['durationSeconds'] and timestamp>=sources[str(path)]['durationSeconds']:
                raise ValueError('Timestamp beyond source duration')
            raw=shared.extract(path,timestamp)
            source_pixel_hash=hashlib.sha256(raw.tobytes()).hexdigest();fx_record=None
            fx_profile=row.get('fxSeparation',{}).get(str(timestamp))
            if fx_profile:
                raw,_,fx_record=separate_fx(raw,path,fx_profile,data.get('allowEnclosedChroma',False))
            source_transform=row.get('sourceTransform')
            if source_transform:
                scale=source_transform['scale'];tx,ty=source_transform['translate']
                if not math.isfinite(scale) or scale<=0 or scale>1 or not all(math.isfinite(v) for v in (tx,ty)):
                    raise ValueError('Reviewed source registration needs finite scale0..1 and translation')
                resized=raw.resize((round(raw.width*scale),round(raw.height*scale)),Image.Resampling.NEAREST)
                if round(tx)<0 or round(ty)<0 or round(tx)+resized.width>raw.width or round(ty)+resized.height>raw.height:
                    raise ValueError('Source registration must preserve the complete source canvas; no clipping allowed')
                registered=Image.new('RGBA',raw.size,(255,0,255,255));registered.paste(resized,(round(tx),round(ty)))
                raw=registered
            frame,bounds,removed=shared.matte(raw,timestamp,.2,data.get('chromaKey','magenta'))
            if data.get('allowEnclosedChroma'):
                if not data.get('enclosedChromaReason') or data.get('chromaKey','magenta')!='magenta':
                    raise ValueError('Enclosed magenta removal requires an explicit reviewed palette reason')
                # Optional reviewed palette profile: remove alpha only. This is
                # needed for closed sky holes in a dragon's horns/wings; default
                # edge-connected matting still protects genuine pink costumes.
                pixels=list(frame.getdata()); original=list(raw.getdata())
                enclosed=0
                for index,(red,green,blue,alpha) in enumerate(original):
                    if pixels[index][3] and min(red,blue)>=80 and min(red,blue)-green>=45 and abs(red-blue)<=65:
                        # Background pixels become transparent black, avoiding
                        # hidden magenta RGB in previews; visible RGB is intact.
                        pixels[index]=(0,0,0,0);enclosed+=1
                frame.putdata(pixels);bounds=frame.getchannel('A').getbbox();removed+=enclosed
                if bounds is None:raise ValueError('Enclosed chroma profile erased the foreground; reject the palette assumption')
            if frames and frame.size!=frames[0].size: raise ValueError('All clips must have identical source canvas dimensions/registration')
            frames.append(frame); boxes.append(bounds)
            samples.append({'source':str(path),'timestampSeconds':timestamp,'sourcePixelsSha256':source_pixel_hash,'derivedFramePixelsSha256':hashlib.sha256(raw.tobytes()).hexdigest(),'freeProjectileFxSeparation':fx_record,'sourceRegistration':source_transform,'backgroundPixelsRemoved':removed})
    atlas,geometry=shared.pack_frames(frames,boxes,cell_size,padding)
    for cell,sample in zip(geometry['frames'],samples): cell.update(sample)
    inputs={spec_path.resolve(),*(Path(p).resolve() for p in sources)}
    if output.resolve() in inputs or output.with_suffix('.json').resolve() in inputs:
        raise ValueError('Output image/metadata must never overwrite a source or selection specification')
    output.parent.mkdir(parents=True,exist_ok=True); atlas.save(output,compress_level=9)
    metadata={'schemaVersion':1,'kind':'multiple-video-action-frame-atlas','sources':sources,'sourceDimensions':list(frames[0].size),**geometry,'sampling':'16 unique source video/timestamp selections; no invented, duplicated or interpolated frames; one common nearest-neighbor crop/scale','releaseCuePolicy':data.get('releaseCuePolicy'),'enclosedChromaProfile':data.get('enclosedChromaReason') if data.get('allowEnclosedChroma') else None,'atlasSha256':hashlib.sha256(output.read_bytes()).hexdigest()}
    output.with_suffix('.json').write_text(json.dumps(metadata,indent=2)+'\n')
    return metadata


def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('spec',type=Path);p.add_argument('output',type=Path);p.add_argument('--cell-size',type=int,default=512);p.add_argument('--padding',type=int,default=12);a=p.parse_args()
    try: result=build(a.spec,a.output,a.cell_size,a.padding)
    except (ValueError,OSError,KeyError,TypeError) as error: p.exit(1,f'ERROR: {error}\n')
    print(json.dumps({'output':str(a.output),'sources':len(result['sources']),'frames':16,'bounds':result['bounds']}))

if __name__=='__main__':main()
