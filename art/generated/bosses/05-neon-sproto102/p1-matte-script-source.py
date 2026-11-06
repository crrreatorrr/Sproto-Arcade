from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,json,hashlib,importlib.util
b=Path(__file__).parent;p='05-neon-sproto102-p1';src=b/f'cockpit-compositions/{p}-composed-raw.png';keyed=b/f'processed-phase-atlases/{p}-composed-prototype-source-keyed-rgba.png';mask=b/f'cockpit-compositions/{p}-all-native-mask.png'
a=np.array(Image.open(keyed).convert('RGBA'));original=np.array(Image.open(src).convert('RGBA'));rgb=original[:,:,:3].astype(float);native=np.array(Image.open(mask).convert('L'))>0
# Only documented warm emission outside physical barrels/projectiles. This never
# selects gray machinery/smoke; native approved cockpit has absolute precedence.
regions=[(1,2,[(86,174),(141,174),(141,207),(117,207),(117,231),(136,241),(88,245)]),(2,2,[(116,195),(170,195),(170,220),(144,220),(144,251),(163,265),(119,276)]),(3,2,[(121,205),(169,205),(169,226),(149,226),(149,264),(166,282),(121,282),(121,252),(124,246),(124,228)]),(3,1,[(155,205),(193,205),(193,224),(185,224),(185,252),(198,254),(198,276),(156,276),(156,251),(171,251),(171,226),(155,226)])]
mi=Image.new('L',(2048,2048));d=ImageDraw.Draw(mi)
for r,c,poly in regions:d.polygon([(c*512+x,r*512+y) for x,y in poly],fill=255)
modify=(np.array(mi)>0)&~native&(a[:,:,3]>0)&(rgb[:,:,0]-rgb[:,:,2]>=8)&(rgb[:,:,1]>=rgb[:,:,2])
bg=np.array([128.,128.,128.]);alpha=np.maximum(np.maximum(rgb-bg,0)/(255-bg),np.maximum(bg-rgb,0)/bg).max(2);alpha=np.clip(alpha,.001,1);fg=np.clip((rgb-(1-alpha[:,:,None])*bg)/alpha[:,:,None],0,255).round().astype('uint8');out=a.copy();out[:,:,:3][modify]=fg[modify];out[:,:,3][modify]=np.round(alpha[modify]*a[:,:,3][modify]).astype('uint8');out[native]=original[native]
assert np.array_equal(out[native],original[native]);assert np.array_equal(out[~modify&~native],a[~modify&~native]);rgba=Image.fromarray(out)
s=importlib.util.spec_from_file_location('extract',Path.cwd()/'tools/extract-boss-clip.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m);frames=[rgba.crop((c*512,r*512,(c+1)*512,(r+1)*512)) for r in range(4) for c in range(4)];bounds=[f.getchannel('A').getbbox() for f in frames];assert all(x and x[0]>1 and x[1]>1 and x[2]<511 and x[3]<511 for x in bounds),bounds
atlas,meta=m.pack_frames(frames,bounds,512,12);dest=b/f'processed-phase-atlases/{p}-clean.png';atlas.save(dest);rgba.save(b/'05p1-clean-source-rgba.png');Image.fromarray(modify.astype('uint8')*255).save(b/'05p1-warm-glow-unmix-mask.png')
meta.update({'source':str(src),'sourceSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'inputKeyedRgba':str(keyed),'inputKeyedSha256':hashlib.sha256(keyed.read_bytes()).hexdigest(),'nativeProtectedMask':str(mask),'nativeProtectedRgbaByteExact':True,'outsideDocumentedChangesRgbaByteExact':True,'backgroundRgb':[128,128,128],'explicitGlowPolygons':regions,'colorGate':'R-B>=8 and G>=B only inside explicit VFX polygons; physical gray/silver machinery and smoke remain native','glowRecoveryPixels':int(modify.sum()),'alphaRecovery':'minimum physically valid alpha=max overchannels positive(C-B)/(255-B),negative(B-C)/B; RGB=(native-(1-alpha)*B)/alpha; no generated art','includesPilot':True,'productionEnabled':False,'outputSha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'script':str(Path(__file__)),'scriptSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()});dest.with_suffix('.json').write_text(json.dumps(meta,indent=2)+'\n')
for name,color in [('black',(8,12,18)),('light',(230,235,240))]:
 bg=Image.new('RGB',atlas.size,color);bg.paste(atlas,mask=atlas.getchannel('A'));bg.resize((1280,1280),Image.Resampling.NEAREST).save(b/f'05p1-clean-{name}-review.png')
print(json.dumps({'output':str(dest),'bounds':meta['bounds'],'changedPixels':int(modify.sum()),'nativeAndOutsideMaskExact':True}))
