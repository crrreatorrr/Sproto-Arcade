"""Conservative magenta field recovery with explicitly reviewed native core guards."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageOps,ImageFilter
import argparse,importlib.util,json,hashlib,numpy as np
p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('profile',type=Path);p.add_argument('output',type=Path);a=p.parse_args();profile=json.loads(a.profile.read_text());s=importlib.util.spec_from_file_location('prep',Path(__file__).parent.parent/'Sproto-Arcade/tools/prepare-boss-atlas.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m);im,bands=m.strip_grid(Image.open(a.source).convert('RGBA'),profile.get('stripGrid',8),'magenta');w,h=im.size;cell=w//4
if w!=h or w%4:raise ValueError('Square4x4 required')
arr=np.array(im);rgb=arr[:,:,:3].astype(float);r,g,b=rgb[:,:,0],rgb[:,:,1],rgb[:,:,2];low=np.minimum(r,b);candidate=Image.fromarray(((low>=180)&(low-g>=95)&(abs(r-b)<=65)).astype('uint8')*255);flood=ImageOps.expand(candidate,1,fill=255);ImageDraw.floodfill(flood,(0,0),128);known=np.array(flood.crop((1,1,w+1,h+1)).point(lambda x:255 if x==128 else 0))>0
field=profile.get('enclosedFieldRule',{'minRB':225,'maxG':35,'minExcess':95,'maxBalance':40})
strong_enclosed=(low>=field['minRB'])&(g<=field['maxG'])&(low-g>=field['minExcess'])&(abs(r-b)<=field['maxBalance'])&~known if profile.get('allowEnclosedStrongField') else np.zeros((h,w),dtype=bool)
known |= strong_enclosed
mask=np.zeros((h,w),dtype=bool)
for item in profile['protectedCores']:
 local=Image.new('L',im.size,0);d=ImageDraw.Draw(local);row=item['row'];cols=item.get('columns',range(4));x,y,ww,hh=item['box']
 for col in cols:d.rectangle((col*cell+x,row*cell+y,col*cell+x+ww-1,row*cell+y+hh-1),fill=255)
 selected=np.array(local)>0
 if item.get('predicate')=='red-pigment':selected &= (r-g>20)&(r-b>20)&(b<160)&(g<140)
 if item.get('predicate')=='lavender-pigment':selected &= (g>=20)&(b>=r-5)&(r-g<=100)&(b-g<=210)
 if item.get('predicate')=='amber-pigment':selected &= (g>=40)&(r-g>10)&(r-b>10)
 if item.get('predicate')=='burgundy-navy-pigment':selected &= ((r-g>20)&(r-b>20)&(b<210)&(g<160))|((g>=8)&(b>=r+5)&(r-g<=50)&(b-g<=180))
 if item.get('predicate')=='sheriff-red-blue-pigment':selected &= ((r-g>25)&(r-b>35)&(b<100)&(g<150))|((g>=8)&(b>=r+5)&(r-g<=50)&(b-g<=180))
 if item.get('insetFromField'):
  distance=item['insetFromField'];near=np.array(Image.fromarray(known.astype('uint8')*255).filter(ImageFilter.MaxFilter(distance*2+1)))>0;selected &= ~near
 mask |= selected
protected=mask&~known&(arr[:,:,3]>0);unmix=(low-g>18)&(arr[:,:,3]>0)&~protected&~known;alpha=np.clip(np.maximum(g,255-low)/255,.0001,1);fg=np.clip((rgb-(1-alpha[:,:,None])*np.array([255.,0.,255.]))/alpha[:,:,None],0,255).round().astype('uint8');out=arr.copy();out[:,:,:3][unmix]=fg[unmix];out[:,:,3][unmix]=np.round(alpha[unmix]*arr[:,:,3][unmix]).astype('uint8');removed=known|(unmix&(out[:,:,3]<=10));out[removed]=0
gray_matte=np.zeros((h,w),dtype=bool)
for item in profile.get('graySmokeRegions',[]):
 row=item['row'];x,y,ww,hh=item['box'];region=np.zeros((h,w),dtype=bool)
 for col in range(4):region[row*cell+y:row*cell+y+hh,col*cell+x:col*cell+x+ww]=True
 selected=region&(g>=70)&(abs(r-b)<=40)&(low-g>10)&~known&~protected
 aa=np.clip(1-(low-g)/255,.0001,1);gray=np.clip(g/aa,0,255).round().astype('uint8')
 for channel in range(3):out[:,:,channel][selected]=gray[selected]
 out[:,:,3][selected]=np.round(aa[selected]*arr[:,:,3][selected]).astype('uint8');gray_matte|=selected;unmix|=selected
assert np.array_equal(out[protected],arr[protected]);assert np.array_equal(out[~unmix&~removed],arr[~unmix&~removed]);rgba=Image.fromarray(out);frames=[];boxes=[];checks=[]
for i in range(16):
 row,col=divmod(i,4);frame=rgba.crop((col*cell,row*cell,(col+1)*cell,(row+1)*cell));box=frame.getchannel('A').getbbox();usable=[0,0,cell,cell]
 for band in bands:
  axis=0 if band['axis']=='x' else 1;start=(col if axis==0 else row)*cell;end=start+cell
  if band['start']<=start<band['end']:usable[axis]=max(usable[axis],band['end']-start)
  if band['start']<end<=band['end']:usable[axis+2]=min(usable[axis+2],band['start']-start)
 if profile.get('sourceRegistrationMetadata'):
  registered=json.loads(Path(profile['sourceRegistrationMetadata']).read_text())['frames'][i]['standardizedUsable'];usable=[max(usable[0],registered[0]),max(usable[1],registered[1]),min(usable[2],registered[2]),min(usable[3],registered[3])]
 if not box or box[0]<=usable[0]+1 or box[1]<=usable[1]+1 or box[2]>=usable[2]-1 or box[3]>=usable[3]-1:raise ValueError(f'Frame{i} touches verified divider/cell: {box},usable{usable}')

 if profile.get('nativeFramesDirectory'):
  native_dir=Path(profile['nativeFramesDirectory']);native_dir.mkdir(parents=True,exist_ok=True);frame.save(native_dir/f'frame-{i:02d}.png')
 frames.append(frame);boxes.append(box);checks.append({'sourceBounds':box,'usable':usable})
atlas,meta=m.shared.pack_frames(frames,boxes,512,12,('attack-a','attack-b','attack-c','heavy'));a.output.parent.mkdir(exist_ok=True,parents=True);atlas.save(a.output,compress_level=9);digest=lambda x:hashlib.sha256(x.read_bytes()).hexdigest();meta.update(kind='reviewed-native-core-protected-magenta-recovery',source=str(a.source),sourceSha256=digest(a.source),profile=profile,profileSha256=digest(a.profile),gridRemovalBands=bands,protectedNativeCorePixels=int(protected.sum()),protectedNativeCoreRgbaByteExact=True,outsideDocumentedChangesRgbaByteExact=True,unmixCriterion='Outside explicit nativecore guards and knownfield: min(R,B)-G>18',alphaFormula='max(G,255-minRB)/255',foregroundFormula='(sourceRGB-(1-alpha)*[255,0,255])/alpha',unmixPixels=int(unmix.sum()),backgroundRemoved=int(removed.sum()),enclosedStrongFieldPixels=int(strong_enclosed.sum()),frameCutoffChecks=checks,atlasSha256=digest(a.output),script=str(Path(__file__)),scriptSha256=digest(Path(__file__)),productionEnabled=False);a.output.with_suffix('.json').write_text(json.dumps(meta,indent=2)+'\n')
for name,mm in [('native-core-protection',protected),('chroma-unmix',unmix),('background-key',removed)]:Image.fromarray(mm.astype('uint8')*255).save(a.output.with_name(a.output.stem+'-'+name+'-mask.png'))
for name,color in [('black',(8,12,18)),('light',(230,235,240))]:
 bg=Image.new('RGB',atlas.size,color);bg.paste(atlas,mask=atlas.getchannel('A'));bg.resize((1280,1280),Image.Resampling.NEAREST).save(a.output.with_name(a.output.stem+'-'+name+'-review.png'))
print(json.dumps({'output':str(a.output),'bounds':meta['bounds'],'rows':meta['rowBounds'],'protectedExact':True}))
