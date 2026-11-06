from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter,ImageChops
import numpy as np,json,hashlib,importlib.util
b=Path(__file__).parent;source=b/'cockpit-compositions/04-ranch-zephyr-p2-composed-raw.png';keyed=b/'processed-phase-atlases/04-ranch-zephyr-p2-composed-prototype-source-keyed-rgba.png';pilotMask=b/'cockpit-compositions/04-ranch-zephyr-p2-native-pilot-mask.png';im=Image.open(keyed).convert('RGBA');original=Image.open(source).convert('RGBA');a=np.array(im);rgb=np.array(original)[:,:,:3].astype(float);protected=np.array(Image.open(pilotMask).convert('L'))>0
regions=[(1,1,[65,215,175,310]),(1,2,[65,215,175,310]),(2,2,[145,155,225,235]),(3,1,[125,240,222,350]),(3,2,[125,240,222,350])]
hardware=Image.new('L',im.size,0);hd=ImageDraw.Draw(hardware)
# Preserve native physical purplebarrels, main orangeboiler and chute rails. The
# gray/pink fringe conversion is limited to surrounding glow plates, never hardware.
for col in [1,2]:hd.rectangle((col*512+170,512+225,col*512+245,512+307),fill=255)
for col in [1,2]:hd.polygon([(col*512+x,512+y) for x,y in [[125,249],[183,249],[183,277],[125,277]]],fill=255)
hd.polygon([(1024+x,1024+y) for x,y in [[180,190],[191,183],[220,212],[208,226]]],fill=255)
for col in [1,2]:
 hd.polygon([(col*512+x,1536+y) for x,y in [[170,225],[245,225],[245,303],[185,303],[170,280]]],fill=255)
 hd.polygon([(col*512+x,1536+y) for x,y in [[185,278],[201,294],[158,337],[140,322]]],fill=255)
hw=np.array(hardware)>0;roi=Image.new('L',im.size,0);rd=ImageDraw.Draw(roi)
for row,col,(x0,y0,x1,y1) in regions:rd.rectangle((col*512+x0,row*512+y0,col*512+x1,row*512+y1),fill=255)
modify=(np.array(roi)>0)&~protected&~hw&(a[:,:,3]>0)
bg=np.array([99.,76.,96.]);delta=rgb-bg;positive=np.maximum(delta,0)/(255-bg);negative=np.maximum(-delta,0)/bg;alpha=np.clip(np.maximum(positive,negative).max(2),.001,1);fg=np.clip((rgb-(1-alpha[:,:,None])*bg)/alpha[:,:,None],0,255).round().astype('uint8');out=a.copy();out[:,:,:3][modify]=fg[modify];out[:,:,3][modify]=np.round(alpha[modify]*a[:,:,3][modify]).astype('uint8');out[:,:,3][modify&(alpha<.025)]=0
# Dimming-only circles whose chromatic ratios match the sampled backdrop are
# background shadow plates, not colored emission. Alpha-only removal stays within
# explicitglow ROI and outside ALLprotected physical hardware.
t=(rgb*bg).sum(2)/(bg*bg).sum();shadow=modify&(t<=1.1)&(np.max(abs(rgb-t[:,:,None]*bg),axis=2)<=8)
out[:,:,:3][shadow]=np.array(original)[:,:,:3][shadow];out[:,:,3][shadow]=0
# Only firstcell hasmagenta background. True purple hardware stays native: limit
# correction to high-intensity key-like pixels adjoining removed field.
empty=Image.fromarray((a[:,:,3]==0).astype('uint8')*255);fringe=np.array(ImageChops.subtract(empty.filter(ImageFilter.MaxFilter(5)),empty))>0;mn=np.minimum(rgb[:,:,0],rgb[:,:,2]);pink=fringe&~protected&~hw&(mn>=180)&(mn-rgb[:,:,1]>=80)&(abs(rgb[:,:,0]-rgb[:,:,2])<=50);pink[512:,:]=False;pink[:,512:]=False
pbg=np.array([253.,0.,253.]);pd=rgb-pbg;pa=np.maximum(np.maximum(pd,0)/np.maximum(255-pbg,1),np.maximum(-pd,0)/np.maximum(pbg,1)).max(2);pa=np.clip(pa,.001,1);pf=np.clip((rgb-(1-pa[:,:,None])*pbg)/pa[:,:,None],0,255).round().astype('uint8');out[:,:,:3][pink]=pf[pink];out[:,:,3][pink]=np.round(pa[pink]*a[:,:,3][pink]).astype('uint8');out[protected]=np.array(original)[protected]
assert np.array_equal(out[protected],np.array(original)[protected]);assert np.array_equal(out[hw],a[hw]);assert np.array_equal(out[~modify&~pink&~protected],a[~modify&~pink&~protected]);rgba=Image.fromarray(out)
s=importlib.util.spec_from_file_location('extract',Path.cwd()/'tools/extract-boss-clip.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m);frames=[rgba.crop((c*512,r*512,(c+1)*512,(r+1)*512)) for r in range(4) for c in range(4)];bounds=[f.getchannel('A').getbbox() for f in frames];assert all(x and x[0]>1 and x[1]>1 and x[2]<511 and x[3]<511 for x in bounds),bounds;atlas,meta=m.pack_frames(frames,bounds,512,12);dest=b/'processed-phase-atlases/04-ranch-zephyr-p2-clean.png';atlas.save(dest);rgba.save(b/'04p2-glow-clean-source-rgba.png');Image.fromarray(modify.astype('uint8')*255).save(b/'04p2-gray-glow-unmix-mask.png');Image.fromarray(pink.astype('uint8')*255).save(b/'04p2-firstcell-pink-fringe-mask.png');hardware.save(b/'04p2-protected-purple-hardware-mask.png');Image.fromarray(shadow.astype('uint8')*255).save(b/'04p2-background-shadow-plate-mask.png');meta.update({'kind':'native-pilot-hardware-protected-glow-recovery','source':str(source),'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'inputKeyedRgba':str(keyed),'inputKeyedSha256':hashlib.sha256(keyed.read_bytes()).hexdigest(),'nativePilotMask':str(pilotMask),'nativePilotRgbaByteExact':True,'physicalPurpleHardwareRgbaByteExact':True,'grayGlowBackgroundRgb':[99,76,96],'grayGlowRegions':regions,'grayGlowPixels':int(modify.sum()),'backgroundShadowPlatePixels':int(shadow.sum()),'shadowPlateRule':'onlyexplicitglowROI outsideprotectedhardware, colorwithin8/channel of a0..1.1scaled knownBG[99,76,96]; alpha-only removal, nativeRGBretained','grayUnmixAlpha':'minimum physically valid alpha=max overchannels of positive(C-B)/(255-B),negative(B-C)/B; values<.025 become0','grayUnmixForeground':'(nativeC-(1-alpha)*knownBG)/alpha clamped0..255; only explicitglow masks outside protected hardware','firstCellPinkFringePixels':int(pink.sum()),'firstCellRule':'only2pxboundary tokeyedfield, highkeylike minRB>=180,minRB-G>=80,absR-B<=50; nativepilot/purplehardware protected','outsideDocumentedChangesRgbaByteExact':True,'includesPilot':True,'productionEnabled':False,'outputSha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'script':str(Path(__file__)),'scriptSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()});dest.with_suffix('.json').write_text(json.dumps(meta,indent=2)+'\n')
for name,color in [('black',(8,12,18)),('light',(230,235,240))]:
 bg=Image.new('RGB',atlas.size,color);bg.paste(atlas,mask=atlas.getchannel('A'));bg.resize((1280,1280),Image.Resampling.NEAREST).save(b/f'04p2-clean-{name}-review.png')
print(json.dumps({'output':str(dest),'bounds':meta['bounds'],'nativePilotAndPurpleHardwareExact':True,'glowPixels':int(modify.sum())}))
