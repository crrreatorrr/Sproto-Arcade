from pathlib import Path
from PIL import Image,ImageDraw
import importlib.util,json,hashlib,math
root=Path(__file__).resolve().parents[2];base=root/'work/art-production';source=base/'raw-atlases/01-marina-bront-p2-concept-animation.mp4';sp=importlib.util.spec_from_file_location('clip',root/'work/Sproto-Arcade/tools/extract-boss-clip.py');clip=importlib.util.module_from_spec(sp);sp.loader.exec_module(clip)
times=[.4,1.1,1.8,2.5,3.1,3.4,4.1,5.5,6.1,6.4,7.1,8.5,9.1,9.4,10.1,11.5];frames=[];boxes=[];records=[]
for i,t in enumerate(times):
 f=clip.extract(source,t);original=f.copy();mask=Image.new('L',f.size,0);p=f.load();mp=mask.load();regions=[]
 if i==6:
  regions=[{'rect':[0,330,205,200],'circle':[205,470,90]},{'rect':[0,530,175,35],'circle':[205,470,90]}]
 if i==14:regions=[{'rect':[0,500,75,220],'circle':[78,596,40]}]
 for region in regions:
  x,y,w,h=region['rect'];cx,cy,r=region['circle']
  for yy in range(y,y+h):
   for xx in range(x,x+w):
    if (xx-cx)**2+(yy-cy)**2>r*r:p[xx,yy]=(255,0,255,255);mp[xx,yy]=255
 if regions:
  f.save(base/f'marina-p2-separated-frame-{i}.png');mask.save(base/f'marina-p2-projectile-exclusion-{i}.png')
 clean,box,removed=clip.matte(f,t,.2);frames.append(clean);boxes.append(box);records.append({'index':i,'timestamp':t,'row':i//4,'column':i%4,'sourceBounds':list(box),'travelingProjectileSeparation':regions,'bodyClipping':False,'reason':'Separate off-frame traveling water/steam particles from the complete physical boss; retain local muzzle ignition and native body pixels' if regions else 'Native genuine video pose, sampled to align anticipation/charge/release/recovery'})
atlas,geo=clip.pack_frames(frames,boxes,512,12);out=base/'processed-phase-atlases/01-marina-bront-p2-video-candidate.png';atlas.save(out);out.with_suffix('.json').write_text(json.dumps({'schemaVersion':1,'kind':'genuine-video-frames-with-explicit-projectile-separation','assetKind':'boss','generationJob':'5c1625e6-6e06-4ecc-8aa0-bb5c7abe3f06','model':'Higgsfield Seedance2.5 Unlimited720p','sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'atlasSha256':hashlib.sha256(out.read_bytes()).hexdigest(),'includesPilot':True,'sourceContainsOffFrameTravelingProjectiles':True,'physicalVehicleComplete':True,'samples':records,**geo},indent=2)+'\n');canvas=Image.new('RGB',atlas.size,(18,20,28));canvas.paste(atlas,(0,0),atlas);canvas.thumbnail((1280,1280));canvas.save(base/'marina-p2-video-candidate-review.png');print(json.dumps({'atlas':str(out),'bounds':geo['bounds'],'frames':16}))
