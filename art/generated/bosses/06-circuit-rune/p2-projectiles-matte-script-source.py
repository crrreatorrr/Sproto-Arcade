"""Source-specific alpha-only green field removal and native cell facing flips."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageOps
import numpy as np,importlib.util,json,hashlib
w=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('frames',w.parent/'Sproto-Arcade/tools/extract-boss-clip.py');shared=importlib.util.module_from_spec(spec);spec.loader.exec_module(shared)
source=w/'raw-phase-projectiles/06-circuit-rune-p2-projectiles.png';im=Image.open(source).convert('RGBA');a=np.array(im);r,g,b=[a[:,:,i].astype(int) for i in range(3)]
key=(g>=180)&(g-np.maximum(r,b)>=95)
candidate=Image.fromarray((key*255).astype('uint8'));f=ImageOps.expand(candidate,1,fill=255);ImageDraw.floodfill(f,(0,0),128,thresh=0);removed=np.array(f.crop((1,1,2049,2049)))==128
# Strict source-field green trapped by white electric arcs is background. Preserve
# all actual green capacitor bands inside the native purple hull scanline envelope.
protected=np.zeros(key.shape,dtype=bool)
for col in range(4):
 x0=col*512;cell=a[1536:2048,x0:x0+512,:3].astype(int)
 purple=(cell[:,:,2]-cell[:,:,0]>=10)&(cell[:,:,2]-cell[:,:,1]>=20)&(cell[:,:,2]>=50)
 for y in range(512):
  xs=np.flatnonzero(purple[y])
  if len(xs)>1:protected[1536+y,x0+int(xs[0]):x0+int(xs[-1])+1]=True
strictField=(g>=230)&(r<=45)&(b<=45)
innerField=strictField&~removed&~protected
removed|=innerField
out=a.copy();out[removed,3]=0
Image.fromarray((innerField*255).astype('uint8')).save(w/'06p2-projectiles-inner-key-field-mask.png')
Image.fromarray((protected*255).astype('uint8')).save(w/'06p2-projectiles-purple-hull-envelope.png')
actualNativeBands=protected&key&~removed
Image.fromarray((actualNativeBands*255).astype('uint8')).save(w/'06p2-projectiles-native-green-band-protection.png')
assert np.array_equal(out[actualNativeBands],a[actualNativeBands])
assert np.array_equal(out[:,:,:3],a[:,:,:3])
rgba=Image.fromarray(out);rgba.save(w/'06p2-projectiles-source-keyed-rgba.png');Image.fromarray((removed*255).astype('uint8')).save(w/'06p2-projectiles-background-key-mask.png')
frames=[];boxes=[];checks=[];normalized=Image.new('RGBA',im.size)
for i in range(16):
 row,col=divmod(i,4);cell=rgba.crop((col*512,row*512,(col+1)*512,(row+1)*512));box=cell.getchannel('A').getbbox()
 if not box or min(box[0],box[1],512-box[2],512-box[3])<=1:raise ValueError(f'Native sourcecell{i}cutoff/residualBG:{box}')
 flip=row in (0,3)
 if flip:cell=ImageOps.mirror(cell)
 normalized.paste(cell,(col*512,row*512));frames.append(cell);boxes.append(cell.getchannel('A').getbbox());checks.append({'row':row,'column':col,'sourceBounds':list(box),'horizontalMirror':flip,'normalizedBounds':list(boxes[-1]),'sourceCutoffPass':True})
normalized.save(w/'06p2-projectiles-left-normalized-rgba.png');atlas,meta=shared.pack_frames(frames,boxes,512,12,('attack-a','attack-b','attack-c','heavy'));target=w/'processed-phase-projectiles/06-circuit-rune-p2-projectiles-initial.png';atlas.save(target);digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();meta.update(kind='green-keyed-projectile-native-facing-normalization',assetKind='projectiles',source=str(source),sourceSha256=digest(source),sourceJobId='8be5e799-466a-4be4-8098-e80e95b7efb6',backgroundKey='green G>=180 and G-max(R,B)>=95, ONLY edgeconnected',backgroundMask=str(w/'06p2-projectiles-background-key-mask.png'),foregroundRgbByteExactBeforeFacing=True,strictEnclosedFieldRule='G>=230,R<=45,B<=45 only outside native purple hull scanline envelope in heavyrow',innerFieldRemovedPixels=int(innerField.sum()),nativeGreenBandProtection=str(w/'06p2-projectiles-native-green-band-protection.png'),actualInternalGreenPreservedByClosedOpaquePurpleOutlines=True,nativeGreenBandRgbaByteExact=True,nativeGreenBandPixels=int(actualNativeBands.sum()),hullEnvelopeBackgroundJudgment='Source overlay audit06p2-green-envelope-cleared-audit.png: cleared keylike pixels within broadscanlineenvelope occur outside actual hull in fin-to-body negative gaps, not internal bandglyphs.',frameCutoffChecks=checks,facing={'A':'All4 horizontal mirrors: white energyhead LEFT, violetcollar and short tail RIGHT','B':'neutral roundorb unchanged','C':'convex crescent head LEFT unchanged','heavy':'All4 horizontal mirrors: pointednose LEFT/fins RIGHT'},script=str(Path(__file__)),scriptSha256=digest(Path(__file__)),productionEnabled=False,outputSha256=digest(target),status='initial alpha-only matte; root visual and possible glow/fringe polish pending');target.with_suffix('.json').write_text(json.dumps(meta,indent=2)+'\n')
for label,color in [('black',(8,12,18)),('light',(230,235,240))]:
 bg=Image.new('RGB',atlas.size,color);bg.paste(atlas,mask=atlas.getchannel('A'));bg.resize((1280,1280),Image.Resampling.NEAREST).save(w/f'06p2-projectiles-initial-{label}-review.png')
print(json.dumps({'sha':meta['outputSha256'],'bounds':meta['bounds'],'rows':meta['rowBounds']}))
