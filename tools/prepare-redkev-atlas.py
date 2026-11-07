#!/usr/bin/env python3
"""Pack actual Redkev source frames with unambiguous connected-component bleed recovery.

Each global non-background component belongs to the cell containing >=95% of
its pixels. Up to16px bleed may be recovered into adjacent blank margins.
Every matted RGBA pixel is copied once into its owner buffer. By default packing
is1x; an explicit --allow-uniform-downscale applies ONE nearest-only scale to all
sixteen frames if the complete shared union cannot fit. No frames are duplicated.
All sixteen frames share ONE crop, scale and translation. No activation or registration is edited.
"""
import argparse
from collections import Counter
import hashlib
import importlib.util
import json
from pathlib import Path
from PIL import Image,ImageChops,ImageDraw,ImageOps

CELL=512
spec=importlib.util.spec_from_file_location('boss_atlas',Path(__file__).with_name('prepare-boss-atlas.py'))
standard=importlib.util.module_from_spec(spec);spec.loader.exec_module(standard)
spec=importlib.util.spec_from_file_location('density_edges',Path(__file__).with_name('prepare-density-assets.py'));edges=importlib.util.module_from_spec(spec);spec.loader.exec_module(edges)


def extend_neon_outside(native,baseline_mask,protected_cabin=(180,80,360,280)):
    """Root-reviewed outside-field white-halo key; never globally key pink."""
    red,green,blue,alpha=native.split()
    def threshold(channel,predicate):return channel.point([255 if predicate(v) else 0 for v in range(256)])
    allowed=Image.new('L',native.size,255)
    for mask in [threshold(red,lambda v:v>=230),threshold(blue,lambda v:v>=230),threshold(ImageChops.difference(red,blue),lambda v:v<=30),threshold(green,lambda v:v<=120),threshold(ImageChops.subtract(red,green),lambda v:v>=110),threshold(ImageChops.subtract(blue,green),lambda v:v>=110)]:allowed=ImageChops.multiply(allowed,mask)
    allowed=ImageChops.lighter(allowed,baseline_mask);flood=ImageOps.expand(allowed,border=1,fill=255);ImageDraw.floodfill(flood,(0,0),128,thresh=0)
    keyed=flood.crop((1,1,native.width+1,native.height+1)).point(lambda v:255 if v==128 else 0);extra=ImageChops.subtract(keyed,baseline_mask)
    protection=Image.new('L',native.size);draw=ImageDraw.Draw(protection)
    x0,y0,x1,y1=protected_cabin
    for row in range(4):
        for col in range(4):draw.rectangle((col*512+x0,row*512+y0,col*512+x1-1,row*512+y1-1),fill=255)
    protected_changes=ImageChops.multiply(extra,protection);extra=ImageChops.subtract(extra,protected_changes);keyed=ImageChops.lighter(baseline_mask,extra)
    result=native.copy();result.putalpha(ImageChops.subtract(alpha,keyed))
    assert ImageChops.difference(result.convert('RGB'),native.convert('RGB')).getbbox() is None
    assert ImageChops.multiply(ImageChops.difference(result.getchannel('A'),alpha),ImageChops.invert(keyed)).getbbox() is None
    return result,keyed,extra,{'method':'edge/background-connected balanced near-magenta white-halo extension only','redMinimum':230,'blueMinimum':230,'maximumRedBlueDifference':30,'greenMaximum':120,'minimumRedBlueMinusGreen':110,'extraSourcePixels':extra.histogram()[255],'protectedCabinCellBox':list(protected_cabin),'protectedCabinCandidatePixelsPreserved':protected_changes.histogram()[255],'allSourceRGBByteExact':True,'allNonKeyedRGBAByteExact':True,'enclosedOrGlobalHueKey':False}


def build(source,output,padding=3,allow_downscale=False,preserve_neon=False,extend_neon_halo=False):
    source=Path(source).resolve();output=Path(output)
    if source in [output.resolve(),output.with_suffix('.json').resolve(),output.with_suffix('.edge-unmix-mask.png').resolve(),output.with_suffix('.source-key-mask.png').resolve(),output.with_suffix('.source-extra-outside-matte-mask.png').resolve()]:raise ValueError('Output must not overwrite native source')
    native=Image.open(source).convert('RGBA')
    if native.size!=(2048,2048):raise ValueError('Expected native2048x2048 4x4 source')
    key_mask=None;key_info=None;extra_mask=None;extra_info=None
    if preserve_neon:
        image,key_mask,key_info=edges.key_background(native,preserve_enclosed_chroma=True)
        if extend_neon_halo:image,key_mask,extra_mask,extra_info=extend_neon_outside(native,key_mask)
        removed=key_mask.histogram()[255]
        box=image.getchannel('A').getbbox()
        if not box or min(box[:2])<2 or max(box[2:])>2046:raise ValueError(f'Neon native subject touches global source edge: {box}')
    else:image,_,removed=standard.shared.matte(native,0,.2,'magenta')
    raw=image.tobytes();alpha=image.getchannel('A').tobytes();seen=bytearray(2048*2048)
    width=CELL+32;buffers=[bytearray(width*CELL*4) for _ in range(16)];components=[];source_count=0
    for seed,a in enumerate(alpha):
        if not a or seen[seed]:continue
        seen[seed]=1;todo=[seed];pixels=[];counts=Counter()
        while todo:
            i=todo.pop();pixels.append(i);x,y=i%2048,i//2048;counts[(y//CELL)*4+x//CELL]+=1
            for dy in [-1,0,1]:
                for dx in [-1,0,1]:
                    if not(dx or dy) or not(0<=x+dx<2048 and 0<=y+dy<2048):continue
                    j=(y+dy)*2048+x+dx
                    if alpha[j] and not seen[j]:seen[j]=1;todo.append(j)
        owner,count=min(counts.items(),key=lambda pair:(-pair[1],pair[0]))
        if count/len(pixels)<.95:raise ValueError(f'Ambiguous multi-cell component: {dict(counts)}')
        col,row=owner%4,owner//4
        box=[min(i%2048 for i in pixels),min(i//2048 for i in pixels),max(i%2048 for i in pixels)+1,max(i//2048 for i in pixels)+1]
        if box[0]<col*CELL-16 or box[2]>(col+1)*CELL+16 or box[1]<row*CELL or box[3]>(row+1)*CELL:
            raise ValueError(f'Component exceeds authorized source recovery window: owner{owner} bounds{box}')
        for i in pixels:
            x,y=i%2048-col*CELL+16,i//2048-row*CELL;destination=(y*width+x)*4
            buffers[owner][destination:destination+4]=raw[i*4:i*4+4]
        source_count+=len(pixels)
        components.append({'owner':owner,'sourceBounds':box,'pixels':len(pixels),'nominalCellPixelCounts':dict(counts),'recoveredPixels':len(pixels)-count})
    frames=[Image.frombytes('RGBA',(width,CELL),bytes(b)) for b in buffers]
    boxes=[f.getchannel('A').getbbox() for f in frames]
    if not all(boxes):raise ValueError('Empty corresponding source frame')
    union=[min(b[0] for b in boxes),min(b[1] for b in boxes),max(b[2] for b in boxes),max(b[3] for b in boxes)]
    w,h=union[2]-union[0],union[3]-union[1]
    available=CELL-padding*2
    scale=min(1,available/w,available/h)
    if scale<1 and not allow_downscale:raise ValueError(f'Exact1x shared union{w}x{h} does not fit512px with{padding}px padding; regenerate wider margins or explicitly authorize uniform downscale')
    dw,dh=max(1,round(w*scale)),max(1,round(h*scale))
    offset=[(CELL-dw)//2,CELL-padding-dh];atlas=Image.new('RGBA',(2048,2048));frame_meta=[];output_count=0
    for index,frame in enumerate(frames):
        cropped=frame.crop(union)
        if scale<1:cropped=cropped.resize((dw,dh),Image.Resampling.NEAREST)
        col,row=index%4,index//4;atlas.paste(cropped,(col*CELL+offset[0],row*CELL+offset[1]))
        box=cropped.getchannel('A').getbbox();bounds=[box[0]+offset[0],box[1]+offset[1],box[2]+offset[0],box[3]+offset[1]]
        output_count+=sum(v!=0 for v in cropped.getchannel('A').tobytes())
        # Independent1:1 byte check at every corresponding foreground location.
        assert cropped.tobytes()==atlas.crop((col*CELL+offset[0],row*CELL+offset[1],col*CELL+offset[0]+dw,row*CELL+offset[1]+dh)).tobytes()
        frame_meta.append({'index':index,'row':row,'column':col,'state':standard.shared.STATES[row],'sourceWindow':[col*CELL-16,row*CELL,width,CELL],'cellBounds':bounds,'sourceBounds':list(boxes[index])})
    owner_count=sum(sum(v!=0 for v in f.getchannel('A').tobytes()) for f in frames)
    assert source_count==owner_count
    if scale==1:assert source_count==output_count
    def common(items):
        x,y=min(b[0] for b in items),min(b[1] for b in items)
        return[x,y,max(b[2] for b in items)-x,max(b[3] for b in items)-y]
    rows=[common([f['cellBounds'] for f in frame_meta[row*4:(row+1)*4]]) for row in range(4)]
    metadata={'schemaVersion':1,'status':'pending-root-visual-review','kind':'prepared-image-sprite-atlas','assetKind':'boss',
      'source':str(source),'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'sourceDimensions':[2048,2048],
      'columns':4,'rows':4,'frameWidth':CELL,'frameHeight':CELL,'states':list(standard.shared.STATES),
      'bounds':common([f['cellBounds'] for f in frame_meta]),'rowBounds':rows,'unionCrop':union,'destinationSize':[dw,dh],'uniformSourceScale':scale,'nearestRasterScale':[dw/w,dh/h],'offset':offset,'padding':padding,'baseline':CELL-padding,'frames':frame_meta,
      'sampling':'one-to-one actual source components; no resize, interpolation, invented, reordered or duplicated frames' if scale==1 else 'one shared uniform nearest-neighbor downscale across16 actual source frames; no invented, reordered or duplicated frames',
      'recovery':{'maximumHorizontalBleed':16,'minimumMajorityOwnership':.95,'components':components,'recoveredPixelCount':sum(c['recoveredPixels'] for c in components),'sourceForegroundPixels':source_count,'outputForegroundPixels':output_count,'sourceForegroundPixelsInOwnerBuffers':owner_count,'allMattedRGBAPixelsCopiedExactlyOnce':True},
      'chroma':{'method':'existing production edge-connected matte and boundary despill before component ownership','backgroundPixelsRemoved':removed}}
    output.parent.mkdir(parents=True,exist_ok=True)
    if preserve_neon:
        key_bytes=edges.png_bytes(key_mask);output.with_suffix('.source-key-mask.png').write_bytes(key_bytes)
        metadata['chroma']={'method':'outside-connected actual-field flood only; intentional neon pink protected','sourceKeying':key_info,'sourceKeyMaskSha256':hashlib.sha256(key_bytes).hexdigest()}
        if extra_mask is not None:
            extra_bytes=edges.png_bytes(extra_mask);output.with_suffix('.source-extra-outside-matte-mask.png').write_bytes(extra_bytes);metadata['chroma']['extraOutsideMatte']={**extra_info,'maskSha256':hashlib.sha256(extra_bytes).hexdigest()}
        metadata['edgeUnmixSkipped']='Protected intentional neon-pink palette; all non-keyed source RGBA byte exact'
    else:
        field=Counter(native.convert('RGB').getdata()).most_common(1)[0][0]
        background=atlas.getchannel('A').point(lambda a:255 if a==0 else 0)
        atlas,edge_mask,edge_info=edges.unmix_pickup_edges(atlas,background,list(field),minimum_channel=180,minimum_excess=110)
        edge_bytes=edges.png_bytes(edge_mask)
        metadata['edgeUnmix']={**edge_info,'maskSha256':hashlib.sha256(edge_bytes).hexdigest()}
        output.with_suffix('.edge-unmix-mask.png').write_bytes(edge_bytes)
    metadata['recovery']['pixelConservationScope']='post-documented-keying in source-owner buffers, before optional shared nearest-downscale and separately recorded final-boundary-unmix if enabled'
    atlas.save(output,compress_level=9)
    metadata['atlasSha256']=hashlib.sha256(output.read_bytes()).hexdigest();output.with_suffix('.json').write_text(json.dumps(metadata,indent=2)+'\n')
    return metadata


def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('source',type=Path);p.add_argument('output',type=Path);p.add_argument('--extend-neon-outside-halo',action='store_true');p.add_argument('--preserve-neon-pink',action='store_true');p.add_argument('--allow-uniform-downscale',action='store_true');p.add_argument('--kind',choices=['boss','projectiles'],default='boss');p.add_argument('--facing',choices=['left','right'],default='left');p.add_argument('--strip-grid',type=int,default=0);a=p.parse_args()
    try:
        if a.extend_neon_outside_halo and not a.preserve_neon_pink:raise ValueError('--extend-neon-outside-halo requires --preserve-neon-pink')
        if a.kind=='projectiles':
            if a.source.resolve() in [a.output.resolve(),a.output.with_suffix('.json').resolve()]:raise ValueError('Output must not overwrite native source')
            meta_path,meta=standard.build(a.source,a.output,kind='projectiles',strip_grid_pixels=a.strip_grid)
            meta['facing']=a.facing;meta['status']='pending-root-visual-review';meta_path.write_text(json.dumps(meta,indent=2)+'\n')
        else:meta=build(a.source,a.output,allow_downscale=a.allow_uniform_downscale,preserve_neon=a.preserve_neon_pink,extend_neon_halo=a.extend_neon_outside_halo)
        print(json.dumps(meta,indent=2))
    except (ValueError,OSError) as e:p.exit(1,str(e)+'\n')
if __name__=='__main__':main()
