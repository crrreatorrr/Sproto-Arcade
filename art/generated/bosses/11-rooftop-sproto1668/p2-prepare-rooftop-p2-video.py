"""Pack native Goldie P2 weapon poses, separating only free ion-beam flight."""
from pathlib import Path
import hashlib
import importlib.util
import json
from PIL import Image, ImageFilter
import numpy as np

base = Path(__file__).resolve().parent
root = base.parents[1]
source = base/'raw-atlases/11-rooftop-sproto1668-p2-animation.mp4'
spec = importlib.util.spec_from_file_location('clip',root/'work/Sproto-Arcade/tools/extract-boss-clip.py')
clip = importlib.util.module_from_spec(spec)
spec.loader.exec_module(clip)
times = [.4,1.1,1.8,2.5,2.6,2.85,3.,4.,6.,6.6,7.,7.6,8.6,8.85,9.5,11.5]
frames, boxes, records = [], [], []
prefire,_,_ = clip.matte(clip.extract(source,8.5),8.5,.2)
protect = prefire.getchannel('A').filter(ImageFilter.MaxFilter(7))
protect.save(base/'11p2-prefire-hardware-protection.png')
for i,t in enumerate(times):
    original = clip.extract(source,t)
    pixels = np.array(original)
    exclusion = np.zeros(pixels.shape[:2],dtype=bool)
    description = None
    if i == 14:
        yy,xx = np.indices(exclusion.shape)
        local = ((xx-310)**2+(yy-480)**2<=60**2)|((xx-395)**2+(yy-590)**2<=60**2)
        roi = (xx<460)&(yy>400)
        exclusion = roi & ~local & (np.array(protect)==0)
        pixels[exclusion] = [255,0,255,255]
        Image.fromarray(exclusion.astype('uint8')*255).save(base/'11p2-ion-flight-exclusion.png')
        description = 'Separate long cyan ion-flight beams outside complete prefire hardware silhouette expanded3px. Retain native60px local ignition bursts centered[310,480] and[395,590]. Never copy source RGB or reconstruct a physical wing.'
    frame,box,_ = clip.matte(Image.fromarray(pixels),t,.2)
    frames.append(frame)
    boxes.append(box)
    records.append({'index':i,'row':i//4,'column':i%4,'timestamp':t,
                    'sourceBounds':list(box),'physicalVehicleComplete':True,
                    'effectSeparation':description})
atlas,geo = clip.pack_frames(frames,boxes,512,12)
dest = base/'processed-phase-atlases/11-rooftop-sproto1668-p2-candidate.png'
atlas.save(dest)
dest.with_suffix('.json').write_text(json.dumps({
    'schemaVersion':1,'kind':'native-video-poses-with-explicit-flight-fx-separation',
    'generationJob':'6058d2a9-77b1-4bc2-9ee8-4e5e1e18e28b',
    'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),
    'atlasSha256':hashlib.sha256(dest.read_bytes()).hexdigest(),
    'includesPilot':True,'facing':'left','samples':records,
    'weaponMechanisms':['underside gold pulse emitter','twin gold-nacelle miniature rocket launchers','paired wing/underside blue ion beam ports'],
    'retiming':'Native12s clip A fires at3s, B7s, C9.5s. Select actual mechanism anticipation/charge/release/recovery rather than arbitrary3s quarter samples.',
    **geo},indent=2)+'\n')
review = Image.new('RGB',atlas.size,(18,23,30))
review.paste(atlas,mask=atlas.getchannel('A'))
review.thumbnail((1536,1536),Image.Resampling.NEAREST)
review.save(base/'11p2-boss-candidate-review.png')
print(json.dumps({'output':str(dest),'bounds':geo['bounds']}))
