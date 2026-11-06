from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,json,hashlib,importlib.util
b=Path(__file__).parent;src=b/'raw-phase-projectiles/06-circuit-rune-p1-projectiles.png';im=Image.open(src).convert('RGBA');a=np.array(im);rgb=a[:,:,:3].astype(float);g=rgb[:,:,1];rb=np.maximum(rgb[:,:,0],rgb[:,:,2]);candidate=(g>=150)&(g-rb>=95);energy=np.zeros((2048,2048),bool);energy[:512,:]=(g[:512,:]>=180)&(rb[:512,:]>=40);candidate&=~energy;background=np.zeros_like(candidate)
for r in range(4):
 for c in range(4):
  cell=Image.fromarray(candidate[r*512:(r+1)*512,c*512:(c+1)*512].astype('uint8')*255).copy()
  for seed in [(16,16),(495,16),(16,495),(495,495)]:
   if cell.getpixel(seed)==255:ImageDraw.floodfill(cell,seed,128)
  background[r*512:(r+1)*512,c*512:(c+1)*512]=np.array(cell)==128
# Pure key in the rowA collar cavities is known field, not lime/white energy.
# Actual colored energy is protected above; this never touches heavy green bands.
background[:512,:]|=candidate[:512,:]
spec=importlib.util.spec_from_file_location('prep',Path.cwd()/'tools/prepare-boss-atlas.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);keyview=im.copy();keyview.paste((0,255,0,255),(0,0,2048,2048),Image.fromarray(background.astype('uint8')*255));grid,bands=m.strip_grid(keyview,16,'green');gridmask=Image.new('L',im.size);gd=ImageDraw.Draw(gridmask)
for band in bands:
 x,y,w,h=band['rectangle'];gd.rectangle((x,y,x+w-1,y+h-1),fill=255)
background|=np.array(gridmask)>0;energy&=~(np.array(gridmask)>0);out=a.copy();out[:,:,3][background]=0
# Only C4 external amber emission is unmixed where native G exceeds actual amber R.
modify=np.zeros_like(background);modify[1024:1536,1536:2048]=True;modify&=~background&(out[:,:,3]>0)&(g-rgb[:,:,0]>=15)
# Heavy3 real green circuit bands stay native inside its purple capsule hull.
def hull(points):
 p=sorted(set(points));cross=lambda o,a,b:(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);lo=[];hi=[]
 for x in p:
  while len(lo)>=2 and cross(lo[-2],lo[-1],x)<=0:lo.pop()
  lo.append(x)
 for x in reversed(p):
  while len(hi)>=2 and cross(hi[-2],hi[-1],x)<=0:hi.pop()
  hi.append(x)
 return lo[:-1]+hi[:-1]
protected=Image.new('L',im.size);pd=ImageDraw.Draw(protected)
for c in range(4):
 cell=rgb[1536:2048,c*512:(c+1)*512];body=(cell[:,:,2]-cell[:,:,1]>=15)&(cell[:,:,2]>=30);ys,xs=np.where(body);poly=hull([(int(x),int(y)) for x,y in zip(xs,ys)]);pd.polygon([(c*512+x,1536+y) for x,y in poly],fill=255)
ph=np.array(protected)>0;halo=np.zeros_like(background);halo[1536:2048,1024:1536]=True;halo&=~ph&~background&(out[:,:,3]>0);modify|=halo;modify&=~energy
bg=np.array([0.,255.,0.]);alpha=np.maximum(np.maximum(rgb-bg,0)/np.maximum(255-bg,1),np.maximum(bg-rgb,0)/np.maximum(bg,1)).max(2);alpha=np.clip(alpha,.001,1);fg=np.clip((rgb-(1-alpha[:,:,None])*bg)/alpha[:,:,None],0,255).round().astype('uint8');out[:,:,:3][modify]=fg[modify];out[:,:,3][modify]=np.round(alpha[modify]*a[:,:,3][modify]).astype('uint8');assert np.array_equal(out[energy],a[energy]);assert np.array_equal(out[ph&~background],a[ph&~background]);assert np.array_equal(out[~background&~modify],a[~background&~modify]);assert np.array_equal(out[:,:,:3][background],a[:,:,:3][background]);rgba=Image.fromarray(out);records=[];frames=[];boxes=[]
rgba.save(b/'06p1-key-debug.png')
for r in range(4):
 for c in range(4):
  f=rgba.crop((c*512,r*512,(c+1)*512,(r+1)*512));box=f.getchannel('A').getbbox();usable=[0,0,512,512]
  for band in bands:
   axis=0 if band['axis']=='x' else 1;start=(c if axis==0 else r)*512;end=start+512
   if band['start']<=start<band['end']:usable[axis]=max(usable[axis],band['end']-start)
   if band['start']<end<=band['end']:usable[axis+2]=min(usable[axis+2],band['start']-start)
  assert box and box[0]>usable[0]+1 and box[1]>usable[1]+1 and box[2]<usable[2]-1 and box[3]<usable[3]-1,(r,c,box,usable)
  frames.append(f);boxes.append(box);records.append({'row':r,'column':c,'sourceBounds':box,'usableAfterGrid':usable})
rawdest=b/'06p1-projectiles-keyed-native-rgba.png';rgba.save(rawdest);atlas,meta=m.shared.pack_frames(frames,boxes,512,12,m.shared.PROJECTILE_STATES);dest=b/'processed-phase-projectiles/06-circuit-rune-p1-projectiles-native-matte.png';atlas.save(dest)
for name,ma in [('background',background),('actual-green-energy-protected',energy),('external-glow-unmix',modify),('purple-capsule-protected',ph)]:Image.fromarray(ma.astype('uint8')*255).save(b/f'06p1-projectiles-{name}-mask.png')
meta.update({'kind':'projectiles-pre-orientation-matte-only','source':str(src),'sourceSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'nativeKeyedRgba':str(rawdest),'nativeKeyedRgbaSha256':hashlib.sha256(rawdest.read_bytes()).hexdigest(),'sourceGreenEnergyRgbaByteExact':True,'sourceCapsulePhysicalBodyAndGreenBandsRgbaByteExact':True,'outsideDocumentedChangesRgbaByteExact':True,'backgroundRule':'G>=150 and G-maxRB>=95, connected to explicit per-cell corner seeds; A genuine green/white energy maxRB>=40 protected, closed capsule bands protected by native dark outline','protectedRowAEnergyPixels':int(energy.sum()),'externalGlowUnmixPixels':int(modify.sum()),'glowRule':'only C4 G>R+15 amber-edge contamination, and Heavy3 external halo outside purple body hull; native actual green energy/bands excluded','gridRemovalBands':bands,'frameCutoffChecks':records,'facing':'PENDING A135degCCW commonrowfit; B/C/heavy KEEP; this native-matte is not runtime-ready','productionEnabled':False,'outputSha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'script':str(Path(__file__)),'scriptSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()});dest.with_suffix('.json').write_text(json.dumps(meta,indent=2)+'\n')
for name,color in [('black',(8,12,18)),('light',(230,235,240))]:
 bg=Image.new('RGB',atlas.size,color);bg.paste(atlas,mask=atlas.getchannel('A'));bg.resize((1280,1280),Image.Resampling.NEAREST).save(b/f'06p1-projectiles-native-{name}-review.png')
print(json.dumps({'sourceRgbPreservedOutsideMasks':True,'outputNativeRgba':str(rawdest),'bounds':meta['bounds'],'actualGreenProtectedPixels':int(energy.sum()),'glowUnmixPixels':int(modify.sum())}))
