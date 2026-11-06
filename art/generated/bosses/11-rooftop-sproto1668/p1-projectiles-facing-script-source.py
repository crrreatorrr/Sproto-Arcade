"""Normalize native weapon projectiles to authored LEFT presentation."""
from pathlib import Path
from PIL import Image,ImageOps
import json,hashlib,importlib.util,math
w=Path(__file__).resolve().parent;src=w/'processed-phase-projectiles/11-rooftop-sproto1668-p1-projectiles-warm-glow-rgba.png';im=Image.open(src).convert('RGBA');heavy=[im.crop((c*512,1536,(c+1)*512,2048)) for c in range(4)];rotated=[f.rotate(135,resample=Image.Resampling.NEAREST,expand=True,fillcolor=(0,0,0,0)) for f in heavy];boxes=[f.getchannel('A').getbbox() for f in rotated];u=[min(k[0] for k in boxes),min(k[1] for k in boxes),max(k[2] for k in boxes),max(k[3] for k in boxes)];uw,uh=u[2]-u[0],u[3]-u[1];scale=min(1,488/uw,488/uh);size=[round(uw*scale),round(uh*scale)];offset=[(512-size[0])//2,(512-size[1])//2];frames=[];normalized=Image.new('RGBA',im.size)
for r in range(4):
 for c in range(4):
  if r==3:
   cell=Image.new('RGBA',(512,512));cell.paste(rotated[c].crop(u).resize(size,Image.Resampling.NEAREST),offset)
  else:
   cell=im.crop((c*512,r*512,(c+1)*512,(r+1)*512))
   if r==1:cell=ImageOps.mirror(cell)
  frames.append(cell);normalized.paste(cell,(c*512,r*512))
normalized.save(w/'11p1-projectiles-left-normalized-native-rgba.png');s=importlib.util.spec_from_file_location('frames',w.parent/'Sproto-Arcade/tools/extract-boss-clip.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m);bounds=[f.getchannel('A').getbbox() for f in frames];assert all(k and min(k[:2])>1 and max(k[2:])<511 for k in bounds),bounds;atlas,meta=m.pack_frames(frames,bounds,512,12,('attack-a','attack-b','attack-c','heavy'));dest=w/'processed-phase-projectiles/11-rooftop-sproto1668-p1-projectiles.png';atlas.save(dest);digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();meta.update(kind='projectiles',facing='left',source=str(src),sourceSha256=digest(src),matteProvenance=str(w/'processed-phase-projectiles/11-rooftop-sproto1668-p1-projectiles-warm-glow-rgba.json'),sourceJobId='c40b469c-c399-4cc3-b318-5ad98285b1d4',fixedFacingNormalization={'A':'leadingwhite/gold capsuleLEFT unchanged','B':'all4 exact nativecell horizontalmirror, leadingiontip LEFT and tail RIGHT','C':'orange/gold flame lobesLEFT frombluecore/nozzletailRIGHT unchanged','heavy':{'rotationDegreesCounterclockwise':135,'sampling':'nearest-neighbor','sharedUnionCrop':u,'sharedScale':scale,'sharedDestinationSize':size,'sharedDestinationOffset':offset,'all4SameTransform':True,'sourceOrderUnchanged':True}},normalizationDoesNotInventArt=True,sourceRGBAColorValuesPreservedByNearestSampling=True,productionEnabled=False,outputSha256=digest(dest),script=str(Path(__file__)),scriptSha256=digest(Path(__file__)),status='awaiting independent rootvisualreview');dest.with_suffix('.json').write_text(json.dumps(meta,indent=2)+'\n')
for label,color in [('black',(8,12,18)),('light',(230,235,240))]:
 bg=Image.new('RGB',atlas.size,color);bg.paste(atlas,mask=atlas.getchannel('A'));bg.resize((1280,1280),Image.Resampling.NEAREST).save(w/f'11p1-projectiles-final-{label}-review.png')
print(json.dumps({'sha':meta['outputSha256'],'bounds':meta['bounds'],'rows':meta['rowBounds'],'heavyScale':scale}))
