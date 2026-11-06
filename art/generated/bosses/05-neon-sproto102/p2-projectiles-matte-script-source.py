from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter,ImageChops
from collections import deque
import numpy as np,json,hashlib,importlib.util
b=Path(__file__).parent;src=b/'raw-phase-projectiles/05-neon-sproto102-p2-projectiles.png';im=Image.open(src).convert('RGBA');a=np.array(im);rgb=a[:,:,:3].astype(float);mn=np.minimum(rgb[:,:,0],rgb[:,:,2]);magenta=(mn>=180)&(mn-rgb[:,:,1]>=60)&(abs(rgb[:,:,0]-rgb[:,:,2])<=50);pastel=(rgb[:,:,0]>=180)&(rgb[:,:,1]>=150)&(rgb[:,:,2]>=180);candidate=magenta|pastel;H,W=candidate.shape;field=np.zeros_like(candidate);q=deque()
for y,x in [(0,x) for x in range(W)]+[(H-1,x) for x in range(W)]+[(y,0) for y in range(H)]+[(y,W-1) for y in range(H)]:
 if candidate[y,x] and not field[y,x]:field[y,x]=True;q.append((y,x))
while q:
 y,x=q.popleft()
 for dy,dx in [(0,1),(0,-1),(1,0),(-1,0)]:
  yy,xx=y+dy,x+dx
  if 0<=yy<H and 0<=xx<W and candidate[yy,xx] and not field[yy,xx]:field[yy,xx]=True;q.append((yy,xx))
# The stepped C wave has an intentionally open flat tail, so its native white
# core can connect to pastel background. Restore only high-G/B native core pixels
# inside the convex envelope of its unambiguous dark/teal body, never field colors.
def hull(points):
 pts=sorted(set(points))
 def cross(o,a,b):return (a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0])
 lower=[]
 for p in pts:
  while len(lower)>=2 and cross(lower[-2],lower[-1],p)<=0:lower.pop()
  lower.append(p)
 upper=[]
 for p in reversed(pts):
  while len(upper)>=2 and cross(upper[-2],upper[-1],p)<=0:upper.pop()
  upper.append(p)
 return lower[:-1]+upper[:-1]
energy=np.zeros_like(field)
for c in range(4):
 cell=rgb[1024:1536,c*512:(c+1)*512];teal=(cell[:,:,0]<180)&(cell[:,:,1]>=50)&(cell[:,:,2]>=60);ys,xs=np.where(teal);poly=hull([(int(x),int(y)) for x,y in zip(xs,ys)]);h=Image.new('L',(512,512));ImageDraw.Draw(h).polygon(poly,fill=255);energy[1024:1536,c*512:(c+1)*512]=(np.array(h)>0)&(cell[:,:,1]>=240)&(cell[:,:,2]>=240)
field&=~energy
out=a.copy();out[:,:,3][field]=0;modify=np.zeros_like(field);hardware=Image.new('L',im.size);hd=ImageDraw.Draw(hardware);boxes=[]
# Real white cores are enclosed by dark/teal bodies. Protect their entire native
# hardware rectangle before recovering only the external soft cyan emission.
for r,c in [(1,2),(1,3),(3,2)]:
 cell=rgb[r*512:(r+1)*512,c*512:(c+1)*512];dark=(cell[:,:,0]<100)&(cell[:,:,1]<155)&(cell[:,:,2]<190);ys,xs=np.where(dark);assert len(xs)>20;box=[int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)];boxes.append({'row':r,'column':c,'nativeHardwareBox':box});hd.rectangle((c*512+box[0]+2,r*512+box[1]+2,c*512+box[2]-3,r*512+box[3]-3),fill=255)
 roi=np.zeros_like(field);roi[r*512+max(0,box[1]-55):r*512+min(512,box[3]+55),c*512+max(0,box[0]-55):c*512+min(512,box[2]+55)]=True;modify|=roi
protected=(np.array(hardware)>0)&~field;modify&=~protected&~field&(out[:,:,3]>0);bg=np.array([255.,0.,255.]);alpha=np.maximum(np.maximum(rgb-bg,0)/np.maximum(255-bg,1),np.maximum(bg-rgb,0)/np.maximum(bg,1)).max(2);alpha=np.clip(alpha,.001,1);fg=np.clip((rgb-(1-alpha[:,:,None])*bg)/alpha[:,:,None],0,255).round().astype('uint8');out[:,:,:3][modify]=fg[modify];out[:,:,3][modify]=np.round(alpha[modify]*a[:,:,3][modify]).astype('uint8');empty=Image.fromarray((out[:,:,3]==0).astype('uint8')*255);edge=np.array(ImageChops.subtract(empty.filter(ImageFilter.MaxFilter(7)),empty))>0;pink=edge&~protected&~field&~energy&(out[:,:,3]>0)&(mn>=40)&(mn-rgb[:,:,1]>=25)&(abs(rgb[:,:,0]-rgb[:,:,2])<=100)
# Pale diagonal fields have a different backdrop; never apply magenta unmix there.
for r,c in [(2,0),(2,2),(3,1),(3,3)]:pink[r*512:(r+1)*512,c*512:(c+1)*512]=False
out[:,:,:3][pink]=fg[pink];out[:,:,3][pink]=np.round(alpha[pink]*a[:,:,3][pink]).astype('uint8');assert np.array_equal(out[protected],a[protected]);assert np.array_equal(out[energy],a[energy]);assert np.array_equal(out[~field&~modify&~pink],a[~field&~modify&~pink]);assert np.array_equal(out[:,:,:3][field],a[:,:,:3][field]);rgba=Image.fromarray(out)
s=importlib.util.spec_from_file_location('extract',Path.cwd()/'tools/extract-boss-clip.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m);frames=[rgba.crop((c*512,r*512,(c+1)*512,(r+1)*512)) for r in range(4) for c in range(4)];bounds=[f.getchannel('A').getbbox() for f in frames];assert all(x and x[0]>2 and x[1]>2 and x[2]<510 and x[3]<510 for x in bounds),bounds;atlas,meta=m.pack_frames(frames,bounds,512,12);dest=b/'processed-phase-projectiles/05-neon-sproto102-p2-projectiles.png';dest.parent.mkdir(exist_ok=True);atlas.save(dest);rgba.save(b/'05p2-projectiles-keyed-source-rgba.png');Image.fromarray(energy.astype('uint8')*255).save(b/'05p2-projectiles-native-white-core-protection.png');Image.fromarray(pink.astype('uint8')*255).save(b/'05p2-projectiles-magenta-fringe-mask.png');Image.fromarray(field.astype('uint8')*255).save(b/'05p2-projectiles-background-mask.png');Image.fromarray(modify.astype('uint8')*255).save(b/'05p2-projectiles-external-glow-mask.png');Image.fromarray(protected.astype('uint8')*255).save(b/'05p2-projectiles-protected-hardware-mask.png');states=['attack-a','attack-b','attack-c','heavy'];meta['states']=states
for rec in meta['frames']:rec['state']=states[rec['row']]
meta.update({'kind':'projectiles','facing':'left','source':str(src),'sourceSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'backgroundRule':'edge-connected union of magenta(minRB>=180,minRB-G>=60,absR-B<=50) and diagonal pastel field(R>=180,G>=150,B>=180); closed white/cyan native cores not connected to border remain opaque','backgroundRemovedPixels':int(field.sum()),'externalGlowRegionsAndProtectedHardware':boxes,'nativeProtectedHardwareRgbaByteExact':True,'hardwareProtection':'native body rectangle inset2px, source white cores and all interior detail unchanged; only proven magenta-dominant edge pixels in3px alpha boundary may be unmixed','outsideDocumentedChangesRgbaByteExact':True,'alphaOnlyBackgroundNativeRgbByteExact':True,'externalCyanGlowUnmixPixels':int(modify.sum()),'magentaBoundaryUnmixPixels':int(pink.sum()),'openTailNativeWhiteCoreProtectedPixels':int(energy.sum()),'whiteCoreRule':'nativeG/B>=240 inside convex envelope of unambiguous teal body in C rows only; sourceRGBA unchanged, protects open-tail core from pastel flood key','glowRecovery':'minimum physically valid alpha from original magenta backdrop, only outside native dark-teal hardware rectangles; no generated art','productionEnabled':False,'outputSha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'script':str(Path(__file__)),'scriptSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()});dest.with_suffix('.json').write_text(json.dumps(meta,indent=2)+'\n')
for name,color in [('black',(8,12,18)),('light',(230,235,240))]:
 bg=Image.new('RGB',atlas.size,color);bg.paste(atlas,mask=atlas.getchannel('A'));bg.resize((1280,1280),Image.Resampling.NEAREST).save(b/f'05p2-projectiles-{name}-review.png')
print(json.dumps({'bounds':meta['bounds'],'rowBounds':meta['rowBounds'],'fieldPixels':int(field.sum()),'glowPixels':int(modify.sum()),'protectedNativeHardware':boxes}))
