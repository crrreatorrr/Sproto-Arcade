from pathlib import Path
from PIL import Image,ImageDraw,ImageOps,ImageChops,ImageFilter
import numpy as np,json,hashlib,importlib.util
b=Path(__file__).parent;src=b/'cockpit-compositions/04-ranch-zephyr-p1-composed-raw.png';maskSrc=b/'cockpit-compositions/04-ranch-zephyr-p1-native-mask.png';im=Image.open(src).convert('RGBA');a=np.array(im);rgb=a[:,:,:3].astype(float);r,g,bl=rgb[:,:,0],rgb[:,:,1],rgb[:,:,2];mn=np.minimum(r,bl)
# Almost-pure field only: charge color remains available for explicit soft-alpha recovery.
can=Image.fromarray(((mn>=230)&(g<=32)&(abs(r-bl)<=25)).astype('uint8')*255);pad=ImageOps.expand(can,1,fill=255);ImageDraw.floodfill(pad,(0,0),128);bg=pad.crop((1,1,2049,2049)).point(lambda v:255 if v==128 else 0);known=np.array(bg)>0;protected=np.array(Image.open(maskSrc).convert('L'))>0
# Enclosed field-colored negative spaces cannot join the exterior flood. These
# pixels match the source's sampled magenta field within10/channel; colored wires
# with a different pigment are excluded and the approved cockpit is protected.
enclosed=(np.max(np.abs(rgb-np.array([253.,1.,253.])),axis=2)<=10)&~known&~protected
known=known|enclosed
regions=[(1,1,[55,205,355,375]),(1,2,[25,235,130,335]),(2,1,[95,205,355,380]),(2,2,[55,175,180,350]),(3,1,[100,210,355,405]),(3,2,[45,260,190,390])]
glow=Image.new('L',im.size,0);d=ImageDraw.Draw(glow)
for row,col,(x0,y0,x1,y1) in regions:d.rectangle((col*512+x0,row*512+y0,col*512+x1,row*512+y1),fill=255)
outer=np.array(ImageChops.subtract(bg.filter(ImageFilter.MaxFilter(7)),bg))>0;modify=(outer|(np.array(glow)>0))&~known&~protected&(mn-g>18)
# Magenta compositing inversion: physical native olive/brass has no magenta excess.
# The non-key G channel and minimum keyed channel jointly bound alpha, preserving
# warm/green charge colors without replacing pixels with any hand-painted palette.
alpha=np.clip(np.maximum(g,255-mn)/255.,.001,1);fg=np.clip((rgb-(1-alpha[:,:,None])*np.array([255.,0.,255.]))/alpha[:,:,None],0,255).round().astype('uint8');out=a.copy();out[:,:,:3][modify]=fg[modify];out[:,:,3][modify]=np.round(alpha[modify]*a[:,:,3][modify]).astype('uint8');out[known&~protected]=0;out[protected]=a[protected]
# Source-closeup-reviewed empty gaps between beige/brass tubes and floating recoil
# streaks. Remove only magenta-direction field mixture, never physical wire pigment.
gapRegions=[]
for row in range(4):
 for col in range(4):
  for box in [[267,166,281,189],[326,232,339,248],[310,290,330,308]]:gapRegions.append([row,col,box])
for col in range(4):gapRegions.append([3,col,[175,277,220,300]])
gapRegions.append([1,2,[175,215,240,262]])
gaps=Image.new('L',im.size,0);gd=ImageDraw.Draw(gaps)
for row,col,(x0,y0,x1,y1) in gapRegions:gd.rectangle((col*512+x0,row*512+y0,col*512+x1,row*512+y1),fill=255)
gapKey=(np.array(gaps)>0)&~protected&(mn-g>18)&(mn>=55)&(out[:,:,3]>0)
out[:,:,:3][gapKey]=a[:,:,:3][gapKey];out[:,:,3][gapKey]=0
assert np.array_equal(out[protected],a[protected]);assert np.array_equal(out[~modify&~known&~gapKey],a[~modify&~known&~gapKey]);rgba=Image.fromarray(out)
s=importlib.util.spec_from_file_location('extract',Path.cwd()/'tools/extract-boss-clip.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m);frames=[rgba.crop((c*512,r*512,(c+1)*512,(r+1)*512)) for r in range(4) for c in range(4)];bounds=[f.getchannel('A').getbbox() for f in frames];assert all(x and x[0]>1 and x[1]>1 and x[2]<511 and x[3]<511 for x in bounds),bounds;atlas,meta=m.pack_frames(frames,bounds,512,12);dest=b/'processed-phase-atlases/04-ranch-zephyr-p1-clean.png';atlas.save(dest);rgba.save(b/'04p1-keyed-source-rgba.png');Image.fromarray(modify.astype('uint8')*255).save(b/'04p1-chroma-unmix-mask.png');Image.fromarray(known.astype('uint8')*255).save(b/'04p1-background-key-mask.png');Image.fromarray(enclosed.astype('uint8')*255).save(b/'04p1-enclosed-field-mask.png');Image.fromarray(gapKey.astype('uint8')*255).save(b/'04p1-explicit-key-gap-mask.png');meta.update({'kind':'native-cockpit-protected-conservative-chroma-recovery','source':str(src),'sourceSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'nativeCockpitMask':str(maskSrc),'nativeCockpitMaskSha256':hashlib.sha256(maskSrc.read_bytes()).hexdigest(),'nativeCockpitRgbaByteExact':True,'backgroundRule':'edgeconnected min(R,B)>=230,G<=32,abs(R-B)<=25','backgroundPixels':int(known.sum()),'enclosedFieldPixels':int(enclosed.sum()),'enclosedRule':'inside or exterior: max absolute RGB distance from sampled backdrop[253,1,253]<=10, exact nativecockpit excluded; alpha-only removal, intentional differentlycolored wires preserved','unmixRegions':regions,'explicitAlphaOnlyKeyGapRegions':gapRegions,'explicitKeyGapPredicate':'native min(R,B)-G>18 and min(R,B)>=55, protectednativecockpit excluded; differentlycoloredbrass/wires haveB<=G and remain unchanged','explicitKeyGapPixels':int(gapKey.sum()),'outerFringeMaxDistance':3,'unmixCriterion':'only documentedglow/outerfringe with min(R,B)-G>18; nativecockpit excluded','alphaFormula':'max(G,255-min(R,B))/255','foregroundFormula':'(sourceRGB-(1-alpha)*[255,0,255])/alpha,clamped0..255','unmixPixels':int(modify.sum()),'outsideDocumentedChangesRgbaByteExact':True,'includesPilot':True,'productionEnabled':False,'outputSha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'script':str(Path(__file__)),'scriptSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()});dest.with_suffix('.json').write_text(json.dumps(meta,indent=2)+'\n')
for name,color in [('black',(8,12,18)),('light',(230,235,240))]:
 bg=Image.new('RGB',atlas.size,color);bg.paste(atlas,mask=atlas.getchannel('A'));bg.resize((1280,1280),Image.Resampling.NEAREST).save(b/f'04p1-clean-{name}-review.png')
print(json.dumps({'output':str(dest),'bounds':meta['bounds'],'unmixPixels':int(modify.sum()),'nativeCockpitExact':True}))
